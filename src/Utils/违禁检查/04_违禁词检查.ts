import { norm } from "./02_词库归一化";
import { root } from "./state";

export function 检查违禁词(text: string): string | null {
    const s = norm(text);
    if (!s) return null;

    let p = root;
    for (const ch of s) {
        while (p !== root && !p.next.has(ch)) {
            p = p.fail!;
        }
        p = p.next.get(ch) ?? root;

        if (p.match !== null) {
            return p.match;
        }
    }
    return null;
}
