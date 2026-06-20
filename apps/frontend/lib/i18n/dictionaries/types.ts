import type { Dictionary } from "./fr";

export type DictionaryOverride = Partial<{
  [Section in keyof Dictionary]: Partial<Dictionary[Section]>;
}>;
