import { build } from "./03_构建匹配树";
import { loadWords } from "./01_加载违禁词";

export const words = loadWords();
export const root = build(words);
