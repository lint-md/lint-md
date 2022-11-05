import type { MarkdownNode } from '@lint-md/parser';
import { parseMd } from '@lint-md/parser';
import { createTraverser } from '../../src/utils/traverser';

describe('test node traverser', () => {
  let nodeQueue: MarkdownNode[] = [];
  let parentNodeQueue: MarkdownNode[] = [];

  const DEMO_MARKDOWN = `# Hello

Some **importance**, and \`code\`.

\`\`\`javascript
console.log('!');
\`\`\`
`;

  const ast = parseMd(DEMO_MARKDOWN);

  beforeEach(() => {
    nodeQueue = [];
    parentNodeQueue = [];
  });

  test('test onLeave in options should be called correctly', () => {
    const traverser = createTraverser({
      onLeave: (node, parent) => {
        nodeQueue.push(node);
        parentNodeQueue.push(parent);
      }
    });

    traverser.traverse(ast, null);
    expect(nodeQueue.map(item => item.type)).toStrictEqual([
      'text',
      'heading',
      'text',
      'text',
      'strong',
      'text',
      'inlineCode',
      'text',
      'paragraph',
      'code',
      'root'
    ]);
    expect(parentNodeQueue.map(item => item?.type)).toStrictEqual([
      'heading',
      'root',
      'paragraph',
      'strong',
      'paragraph',
      'paragraph',
      'paragraph',
      'paragraph',
      'root',
      'root',
      undefined
    ]);
  });

  test('test onEnter in options should be called correctly', () => {
    const traverser = createTraverser({
      onEnter: (node, parent) => {
        nodeQueue.push(node);
        parentNodeQueue.push(parent);
      }
    });

    traverser.traverse(ast, null);
    expect(nodeQueue.map(item => item.type)).toStrictEqual([
      'root',
      'heading',
      'text',
      'paragraph',
      'text',
      'strong',
      'text',
      'text',
      'inlineCode',
      'text',
      'code'
    ]);
    expect(parentNodeQueue.map(item => item?.type)).toStrictEqual([
      undefined,
      'root',
      'heading',
      'root',
      'paragraph',
      'paragraph',
      'strong',
      'paragraph',
      'paragraph',
      'paragraph',
      'root'
    ]);
  });

  test('test invalid node', () => {
    const traverser = createTraverser({
      onLeave: (node, parent) => {
        nodeQueue.push(node);
        parentNodeQueue.push(parent);
      }
    });

    traverser.traverse(undefined, undefined);
    expect(nodeQueue.length).toStrictEqual(0);
    expect(parentNodeQueue.length).toStrictEqual(0);
  });
});
