import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { norm } from "./归一化";

export const loadWords = (): string[] => {
    const dir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const files = [
        resolve(dir, "../assets/SensitiveLexicon.json"),
        resolve(dir, "../../src/assets/SensitiveLexicon.json"),
        resolve(process.cwd(), "src/assets/SensitiveLexicon.json"),
    ];

    for (const file of files) {
        try {
            const content = readFileSync(file, "utf8");
            const json = JSON.parse(content) as { words?: unknown };

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
        } catch {
            continue;
        }
    }
    return [];
};
