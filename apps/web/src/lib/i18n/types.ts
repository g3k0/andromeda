export type MessageTree = {
  [key: string]: string | MessageTree;
};

export type TranslationParams = Record<
  string,
  string | number | boolean | null | undefined
>;
