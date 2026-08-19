import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

export interface 版本日志条目 {
    版本: string;
    发布时间: string;
    日志: string[];
}

let 版本日志缓存: 版本日志条目[] | null = null;

export function 获取所有版本日志(): 版本日志条目[] {
    if (!版本日志缓存) {
        try {
            const 文件路径 = fileURLToPath(new URL("../../assets/版本日志.json", import.meta.url));
            const 内容 = fs.readFileSync(文件路径, "utf-8");
            版本日志缓存 = JSON.parse(内容);
        } catch (error) {
            console.error("加载版本日志失败:", error);
            版本日志缓存 = [];
        }
    }
    return 版本日志缓存 || [];
}

export function 获取版本日志(版本号?: string): 版本日志条目 | undefined {
    const 所有日志 = 获取所有版本日志();

    if (!版本号) {
        return 所有日志[0];
    }

    return 所有日志.find((日志) => 日志.版本 === 版本号);
}

export function 列出所有版本(): string[] {
    return 获取所有版本日志().map((日志) => 日志.版本);
}

export function 格式化版本日志(日志: 版本日志条目): string {
    const 行列 = [`【${日志.版本}】发布于 ${日志.发布时间}`, ...日志.日志.map((行) => `  - ${行}`)];
    return 行列.join("\n");
}

export function 格式化版本列表(): string {
    const 所有日志 = 获取所有版本日志();
    if (所有日志.length === 0) {
        return "暂无版本日志";
    }

    const 行列 = [
        "【征战文游】版本列表:",
        ...所有日志.map((日志) => `  ${日志.版本} (${日志.发布时间})`),
    ];
    return 行列.join("\n");
}
