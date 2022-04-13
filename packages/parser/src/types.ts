import { Parent } from 'unist';

export type MarkdownNode = Omit<Parent, 'children'> & {
  children?: MarkdownNode[];
};
