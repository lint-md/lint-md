import { parseMdWithSourceMap } from '@lint-md/parser';
import type { LintMdRuleWithOptions, RunLintOptions } from '../types';
import { createEmitter } from '../utils/emitter';
import { createTraverser } from '../utils/traverser';
import { createRuleManager } from '../utils/rule-manager';
import { createRuleErrorCollector } from '../utils/rule-execution-errors';
import { registerTextNodeSourceMap } from '../utils/text-scanner';

/**
 * 基于各种 rules 对 Markdown 文本进行校验
 *
 * 规则执行错误策略（见 issue #179）：
 * - 默认兼容模式（collect）：任一 selector 抛错时，仅记录该规则该节点的失败，
 *   不打断同节点其它规则，也不打断后续节点遍历；不写 console.error，错误以
 *   结构化 executionErrors 数组随结果返回。
 * - 严格模式（strict）：首次规则执行失败立即抛 RuleExecutionFailure。
 * 错误按 listener（selector）逐条捕获，而非包住整次 emitter.emit()，
 * 这样才能满足“多个规则失败、部分成功”的验收。
 *
 * @date 2021-12-12 21:48:21
 */
export const runLint = (
  markdown: string,
  allRuleConfigs: LintMdRuleWithOptions[],
  options: RunLintOptions = {}
) => {
  const policy = options.ruleErrorPolicy ?? 'collect';
  const round = options.round ?? 0;

  // 先创建收集器，再创建 ruleManager：getAllFixes() 内的 fix() 阶段错误才能接入收集器。
  const collector = createRuleErrorCollector(policy, round);

  // Parser owns normalized-text -> original-Markdown mapping.  Register it
  // internally for TextScanner without changing the third-party rule context.
  const { ast, sourceMap } = parseMdWithSourceMap(markdown);
  registerTextNodeSourceMap(ast, sourceMap);

  // 全局规则管理器（传入 collector，使 fix 阶段捕获生效）
  const ruleManager = createRuleManager(markdown, collector);

  const emitter = createEmitter();

  // 遍历器：按节点分发事件。这里不再包 try/catch —— 失败捕获下沉到各 listener。
  const traverser = createTraverser({
    onEnter: (node) => {
      if (node.type) {
        emitter.emit(node.type, node);
      }
    }
  });

  // 遍历所有的 rules，并拿到它们的选择器，为每一个选择器订阅相关事件。
  // 注册时逐个包装 selector：同一节点上某坏规则抛错不会阻断其它规则，且能准确记录 ruleName。
  for (const { rule, options: ruleOptions } of allRuleConfigs) {
    const ruleContext = ruleManager.createRuleContext(
      { rule, options: ruleOptions },
      { ast, markdown }
    );

    // create 阶段也可能抛错，需在调用 create 处捕获并归入规则执行错误。
    let ruleSelectors: Record<string, (node: any) => void>;
    try {
      ruleSelectors = rule.create(ruleContext);
    }
    catch (e) {
      collector.collect(rule.meta.name, 'create', e);
      continue;
    }

    for (const selector of Object.keys(ruleSelectors)) {
      const originalSelector = ruleSelectors[selector];
      const ruleName = rule.meta.name;
      emitter.on(selector, (node) => {
        try {
          originalSelector(node);
        }
        catch (error) {
          // 严格模式会在 collect 内抛出 RuleExecutionFailure，向上传递。
          collector.collect(ruleName, 'selector', error, node.type);
        }
      });
    }
  }

  // 递归地遍历 ast；selector 失败已在 listener 内逐条处理，此处不再吞错。
  traverser.traverse(ast, null);

  return {
    ruleManager,
    executionErrors: collector.getErrors()
  };
};
