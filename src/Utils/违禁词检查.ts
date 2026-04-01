import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 优化 1：精简 Node 结构，将 string[] 改为单一的 string | null
// 极大地降低内存占用并减少垃圾回收压力
type Node = {
    next: Map<string, Node>;
    fail: Node | null;
    match: string | null;
};

// 优化 2：预编译正则表达式，并将两步合并为一步
// 提升每次检查用户输入时的性能
const IGNORE_CHARS_RE = /[\u200B-\u200D\uFEFF\p{White_Space}\p{P}\p{S}_]+/gu;
const norm = (s: string) =>
    s.normalize("NFKC").toLowerCase().replace(IGNORE_CHARS_RE, "");

const loadWords = (): string[] => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const files = [
        resolve(dir, "../assets/SensitiveLexicon.json"),
        resolve(dir, "../../src/assets/SensitiveLexicon.json"),
        resolve(process.cwd(), "src/assets/SensitiveLexicon.json"),
    ];

    for (const file of files) {
        // 优化 3：移除 existsSync，直接 try/catch 减少一次系统调用的开销
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
            // 文件不存在或非 JSON，跳过并尝试下一个路径
            continue;
        }
    }
    return [];
};

const build = (words: readonly string[]): Node => {
    const root: Node = { next: new Map(), fail: null, match: null };

    // 构建 Trie 树
    for (const w of words) {
        let p = root;
        for (const ch of w) {
            let nextNode = p.next.get(ch);
            if (!nextNode) {
                nextNode = { next: new Map(), fail: null, match: null };
                p.next.set(ch, nextNode);
            }
            p = nextNode;
        }
        p.match = w; // 终点记录完整的违禁词
    }

    // 优化 4：使用双指针（数组 + head 游标）代替 q.shift()
    // 将出队时间复杂度从 O(N) 降为 O(1)，秒建大词库
    const q: Node[] = [];
    let head = 0;

    for (const c of root.next.values()) {
        c.fail = root;
        q.push(c);
    }

    while (head < q.length) {
        const cur = q[head++]; // O(1) 出队
        for (const [ch, nx] of cur.next) {
            let f = cur.fail;
            while (f && !f.next.has(ch)) {
                f = f.fail;
            }
            nx.fail = f ? f.next.get(ch)! : root;

            // 优化 5：通过空值合并运算符传递匹配状态，替代原有的数组平铺 (push(...))
            // 如果当前节点自身不是完整词，但其 fail 节点是，则继承其 fail 节点的词
            nx.match = nx.match ?? nx.fail.match;
            q.push(nx);
        }
    }

    return root;
};

const words = loadWords();
const root = build(words);

export function 检查违禁词(text: string): string | null {
    const s = norm(text);
    if (!s) return null;

    let p = root;
    for (const ch of s) {
        // 当 p 不为 root 时，p.fail 绝对不为空，可以使用断言 (!)
        while (p !== root && !p.next.has(ch)) {
            p = p.fail!;
        }
        p = p.next.get(ch) ?? root;

        // 如果命中任何词，直接返回
        if (p.match !== null) {
            return p.match;
        }
    }
    return null;
}

export function 获取违禁词数量(): number {
    return words.length;
}
