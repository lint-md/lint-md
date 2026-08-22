import type {
  LintMdRule,
  PositionedMarkdownNode
} from '../types.js';
import { traverseMarkdown } from '../utils/traverser.js';

type PositionedLinkLikeNode = Extract<
  PositionedMarkdownNode,
  { type: 'link' | 'linkReference' }
>;

const TRANSPARENT_NODE_TYPES = new Set(['strong', 'emphasis', 'delete']);
const TRANSPARENT_MARKERS = ['**', '__', '~~', '*', '_'];
const TRANSPARENT_MARKER_CHARACTER = /[*_~]/u;

const needsSpace = (character: string): boolean => {
  return !/[\s\p{P}]/u.test(character);
};

const isWordCharacter = (character: string | undefined): boolean => {
  return character !== undefined && /[\p{L}\p{N}]/u.test(character);
};

const getChildren = (node: PositionedMarkdownNode): PositionedMarkdownNode[] => {
  if ('children' in node && Array.isArray(node.children)) {
    return node.children as PositionedMarkdownNode[];
  }
  return [];
};

const spaceAroundLink: LintMdRule = {
  meta: {
    name: 'space-around-link'
  },
  create(context) {
    const linkStarts = new Set<number>();
    const linkEnds = new Set<number>();
    const links: PositionedLinkLikeNode[] = [];
    const parents = new WeakMap<
      PositionedMarkdownNode,
      PositionedMarkdownNode | null
    >();
    const reportedOffsets = new Set<number>();

    traverseMarkdown(context.ast, {
      enter(node, parent) {
        parents.set(node, parent);
        if (node.type === 'link' || node.type === 'linkReference') {
          links.push(node);
        }
      }
    });

    const getBoundaryNode = (
      node: PositionedMarkdownNode,
      side: 'start' | 'end'
    ): PositionedMarkdownNode => {
      let boundary = node;
      let parent = parents.get(boundary);

      while (parent && TRANSPARENT_NODE_TYPES.has(parent.type)) {
        const children = getChildren(parent);
        const edgeChild = side === 'start'
          ? children[0]
          : children[children.length - 1];

        if (edgeChild !== boundary) {
          break;
        }

        boundary = parent;
        parent = parents.get(boundary);
      }

      return boundary;
    };

    const getBoundaryRange = (link: PositionedLinkLikeNode) => {
      let start = getBoundaryNode(link, 'start').position.start.offset;
      let end = getBoundaryNode(link, 'end').position.end.offset;
      let expanded = true;

      while (expanded) {
        expanded = false;

        for (const marker of TRANSPARENT_MARKERS) {
          const isIntrawordUnderscore = marker.includes('_')
            && (
              isWordCharacter(context.sourceCode.text[start - marker.length - 1])
              || isWordCharacter(context.sourceCode.text[end + marker.length])
            );

          if (
            !isIntrawordUnderscore
            && context.sourceCode.text.slice(start - marker.length, start) === marker
            && context.sourceCode.text.slice(end, end + marker.length) === marker
          ) {
            start -= marker.length;
            end += marker.length;
            expanded = true;
            break;
          }
        }
      }

      return { start, end };
    };

    const getAdjacentNode = (
      link: PositionedLinkLikeNode,
      side: 'start' | 'end'
    ): PositionedMarkdownNode | undefined => {
      const boundary = getBoundaryNode(link, side);
      const parent = parents.get(boundary);

      if (!parent) {
        return undefined;
      }

      const siblings = getChildren(parent);
      const index = siblings.indexOf(boundary);
      return side === 'start' ? siblings[index - 1] : siblings[index + 1];
    };

    const getVisibleTextCharacter = (
      node: PositionedMarkdownNode,
      side: 'start' | 'end'
    ): string | undefined => {
      if (node.type === 'image' || node.type === 'break') {
        return undefined;
      }

      if (node.type !== 'text') {
        const children = getChildren(node);

        if (children.length > 0) {
          const orderedChildren = side === 'start'
            ? [...children].reverse()
            : children;

          for (const child of orderedChildren) {
            const character = getVisibleTextCharacter(child, side);

            if (character !== undefined) {
              return character;
            }
          }

          return undefined;
        }

        return 'a';
      }

      let value = node.value;
      let stripped = true;

      while (stripped) {
        stripped = false;

        for (const marker of TRANSPARENT_MARKERS) {
          if (
            value.length > marker.length * 2
            && value.startsWith(marker)
            && value.endsWith(marker)
          ) {
            value = value.slice(marker.length, -marker.length);
            stripped = true;
            break;
          }
        }
      }

      const characters = Array.from(value);
      return side === 'start' ? characters.at(-1) : characters[0];
    };

    const getRawBoundaryCharacter = (
      side: 'start' | 'end',
      offset: number
    ): string | undefined => {
      const text = side === 'start'
        ? context.sourceCode.text.slice(Math.max(0, offset - 2), offset)
        : context.sourceCode.text.slice(offset, offset + 2);
      const characters = Array.from(text);

      return side === 'start' ? characters.at(-1) : characters[0];
    };

    const getBoundaryCharacter = (
      link: PositionedLinkLikeNode,
      side: 'start' | 'end',
      offset: number
    ): string => {
      const adjacentNode = getAdjacentNode(link, side);
      const visibleCharacter = adjacentNode
        ? getVisibleTextCharacter(adjacentNode, side)
        : undefined;

      if (
        visibleCharacter !== undefined
        && !TRANSPARENT_MARKER_CHARACTER.test(visibleCharacter)
      ) {
        return visibleCharacter;
      }

      return getRawBoundaryCharacter(side, offset) ?? visibleCharacter ?? '';
    };

    for (const link of links) {
      const { start, end } = getBoundaryRange(link);
      linkStarts.add(start);
      linkEnds.add(end);
    }

    const report = (offset: number) => {
      if (reportedOffsets.has(offset)) {
        return;
      }
      reportedOffsets.add(offset);
      context.report({
        range: [offset, offset],
        message: '链接与正文之间需要添加空格',
        fix: fixer => fixer.insertTextAt(offset, ' ')
      });
    };

    const checkLink = (node: PositionedLinkLikeNode) => {
      const { start, end } = getBoundaryRange(node);

      if (
        start > 0
        && (
          linkEnds.has(start)
          || needsSpace(getBoundaryCharacter(node, 'start', start))
        )
      ) {
        report(start);
      }

      if (
        end < context.sourceCode.text.length
        && (
          linkStarts.has(end)
          || needsSpace(getBoundaryCharacter(node, 'end', end))
        )
      ) {
        report(end);
      }
    };

    return {
      link: checkLink,
      linkReference: checkLink
    };
  }
};

export default spaceAroundLink;
