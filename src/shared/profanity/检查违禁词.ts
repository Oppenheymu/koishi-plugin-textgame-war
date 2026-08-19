import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "#shared/profanity/构建匹配树";

const IGNORE_CHARS_RE = /[\u200B-\u200D\uFEFF\p{White_Space}\p{P}\p{S}_]+/gu;

const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(IGNORE_CHARS_RE, "");

const loadWords = (): string[] => {
    const dir = fileURLToPath(new URL("..", import.meta.url));
    const files = [
        resolve(dir, "../assets/SensitiveLexicon.json"),
        resolve(dir, "../../src/assets/SensitiveLexicon.json"),
        resolve(process.cwd(), "src/assets/SensitiveLexicon.json"),
    ];

    for (const file of files) {
        try {
            const content = readFileSync(file, "utf8");
            const json = JSON.parse(content) as {
                words?: unknown;
            };

            if (Array.isArray(json.words)) {
                const seen = new Set<string>();
                const words: string[] = [];
                for (const w of json.words) {
                    if (typeof w !== "string") continue;
                    const n = norm(w);
                    if (!n || seen.has(n)) continue;
                    seen.add(n);
                    words.push(n);
                }
                return words;
            }
        } catch {}
    }
    return [];
};

const words = loadWords();
const root = build(words);

export function 检查违禁词(text: string): string | null {
    const s = norm(text);
    if (!s) return null;

    let p = root;
    for (const ch of s) {
        while (p !== root && !p.next.has(ch)) {
            if (!p.fail) {
                p = root;
                break;
            }
            p = p.fail;
        }
        p = p.next.get(ch) ?? root;

        if (p.match !== null) {
            return p.match;
        }
    }
    return null;
}
