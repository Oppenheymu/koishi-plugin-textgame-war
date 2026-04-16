import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function 查找项目根目录(起始目录: string): string {
	let 当前目录 = 起始目录;
	while (true) {
		if (existsSync(resolve(当前目录, "package.json"))) return 当前目录;
		const 上级目录 = dirname(当前目录);
		if (上级目录 === 当前目录) return 起始目录;
		当前目录 = 上级目录;
	}
}
