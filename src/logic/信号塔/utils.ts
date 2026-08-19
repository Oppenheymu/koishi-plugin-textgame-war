import type { Context } from "koishi";
import type { 信号塔平台 } from "./联军/types";

/**
 * 信号塔支持的平台列表
 */
export const 信号塔平台列表: 信号塔平台[] = ["onebot", "discord", "telegram"];

/**
 * 标准化频道列表，去除重复和空值
 */
export function 标准化频道列表(频道列表: string[]): string[] {
    return Array.from(new Set(频道列表.map((频道) => 频道.trim()).filter(Boolean)));
}

/**
 * 通用的尝试操作包装器（错误捕获）
 */
export async function 尝试执行<T>(
    logger: ReturnType<Context["logger"]>,
    标签: string,
    操作: () => Promise<T>,
): Promise<T | null> {
    try {
        return await 操作();
    } catch (error) {
        const 错误信息 = error instanceof Error ? error.message : "未知错误";
        logger.warn(`${标签}流程异常：${错误信息}`);
        return null;
    }
}

/**
 * 通用的消息发送结果类型
 */
export interface 发送记录 {
    平台: 信号塔平台;
    群聊ID: string;
}

export interface 发送失败记录 {
    平台: 信号塔平台;
    群聊ID?: string;
    原因: string;
}
