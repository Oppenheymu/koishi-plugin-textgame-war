import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

// 开发模式（esbuild-register 直载 .ts 源码）下的运行时模块解析钩子。
//
// koishi 用 esbuild-register 加载本项目的 .ts 源码时，esbuild-register 只会读取
// 父 workspace（koishi-app）的 tsconfig paths，既无法识别本项目的 #/、#ctx/、
// #shared/ 别名，也不会把 NodeNext 的相对导入 ./xxx.js 映射回 ./xxx.ts。
// 这两点都会导致开发模式下插件加载失败（Cannot find module '.../src/xxx.ts'）。
//
// 本模块在 src/index.ts 的最前面以副作用方式引入，先注册好解析钩子，
// 再让后续所有 import 都能被正确解析。生产环境使用打包产物，不经过此钩子。

const 模块Require = createRequire(__filename);

type 解析文件名函数 = (
    请求: string,
    父模块: { path?: string; filename?: string } | null,
    是否主模块: boolean,
    选项?: unknown,
) => string;

const 原生模块 = 模块Require("node:module") as unknown as {
    _resolveFilename: 解析文件名函数;
    _extensions: Record<string, unknown>;
};

const 别名映射: ReadonlyArray<readonly [string, string]> = [
    ["#ctx/", resolve(__dirname, "../contexts")],
    ["#shared/", resolve(__dirname, "../shared")],
    ["#/", resolve(__dirname, "..")],
];

function 解析别名(请求: string): string | null {
    for (const [前缀, 基础目录] of 别名映射) {
        if (!请求.startsWith(前缀)) continue;
        const 子路径 = 请求.slice(前缀.length);
        const 文件候选 = resolve(基础目录, `${子路径}.ts`);
        const 目录候选 = resolve(基础目录, 子路径, "index.ts");
        if (existsSync(文件候选)) return 文件候选;
        if (existsSync(目录候选)) return 目录候选;
        return null;
    }
    return null;
}

function 解析相对导入(绝对路径: string): string | null {
    if (!绝对路径.endsWith(".js")) return null;
    const 去后缀 = 绝对路径.slice(0, -3);
    for (const 候选 of [`${去后缀}.ts`, `${去后缀}.tsx`]) {
        if (existsSync(候选)) return 候选;
    }
    return null;
}

const 原始解析文件名 = 原生模块._resolveFilename.bind(原生模块);

function 自定义解析文件名(
    请求: string,
    父模块: { path?: string; filename?: string } | null,
    是否主模块: boolean,
    选项?: unknown,
): string {
    const 别名结果 = 解析别名(请求);
    if (别名结果) return 别名结果;

    if (请求.startsWith("./") || 请求.startsWith("../")) {
        const 父目录 = 父模块?.path ?? process.cwd();
        const 相对结果 = 解析相对导入(resolve(父目录, 请求));
        if (相对结果) return 相对结果;
    }

    return 原始解析文件名(请求, 父模块, 是否主模块, 选项);
}

// 仅当 esbuild-register 已注册 .ts 扩展（即开发模式）时启用，避免污染生产环境。
if (原生模块._extensions[".ts"]) {
    原生模块._resolveFilename = 自定义解析文件名;
}
