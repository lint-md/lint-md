import { parseMd } from '@lint-md/parser';
import type { PositionedMarkdownNode } from '../../src/types';
import {
  createTraverser,
  traverseMarkdown
} from '../../src/utils/traverser';

describe('test node traverser', () => {
  let nodeQueue: PositionedMarkdownNode[] = [];
  let parentNodeQueue: (PositionedMarkdownNode | null)[] = [];

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

  test('test leave in options should be called correctly', () => {
    traverseMarkdown(ast, {
      leave: (node, parent) => {
        nodeQueue.push(node);
        parentNodeQueue.push(parent);
      }
    });

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

  test('test enter in options should be called correctly', () => {
    traverseMarkdown(ast, {
      enter: (node, parent) => {
        nodeQueue.push(node);
        parentNodeQueue.push(parent);
      }
    });

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
    traverseMarkdown(null, {
      leave: (node, parent) => {
        nodeQueue.push(node);
        parentNodeQueue.push(parent);
      }
    });

    expect(nodeQueue.length).toStrictEqual(0);
    expect(parentNodeQueue.length).toStrictEqual(0);
  });

  test('test legacy traverser compatibility', () => {
    const traverser = createTraverser({
      onEnter: (node, parent) => {
        nodeQueue.push(node);
        parentNodeQueue.push(parent);
      }
    });

    traverser.traverse(ast, null);
    expect(nodeQueue[0].type).toStrictEqual('root');
    expect(parentNodeQueue[0]).toBeNull();
  });
});
