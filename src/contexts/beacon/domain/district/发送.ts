import type { Context } from "koishi";
import type { 地区信号塔事件参数, 地区信号塔通报结果 } from "#ctx/beacon/domain/district/types";
import { 构建地区事件内容 } from "#ctx/beacon/domain/district/构建";
import { 尝试发送新闻信号塔通报 } from "#ctx/beacon/domain/news";
import { 尝试执行 } from "#ctx/beacon/infrastructure/utils";

/**
 * 发送地区事件信号塔通报（通用接口）
 */
async function 发送地区信号塔通报(
    ctx: Context,
    参数: 地区信号塔事件参数,
): Promise<地区信号塔通报结果> {
    const { 标题, 内容 } = 构建地区事件内容(参数);

    const 发送结果 = await 尝试发送新闻信号塔通报(ctx, {
        标题,
        前缀: "地区信号塔",
        内容,
    });

    if (!发送结果) {
        throw new Error("地区信号塔推送失败");
    }

    return 发送结果;
}

/**
 * 尝试发送地区事件信号塔通报（异常捕获）
 */
export async function 尝试发送地区信号塔通报(
    ctx: Context,
    参数: 地区信号塔事件参数,
): Promise<地区信号塔通报结果 | null> {
    return 尝试执行(ctx.logger("信号塔:地区"), "地区信号塔", () => 发送地区信号塔通报(ctx, 参数));
}
