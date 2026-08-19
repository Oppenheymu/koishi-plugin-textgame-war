import type { Context } from "koishi";
import type { 地区信号塔通报结果, 地区刷新事件参数 } from "#ctx/beacon/地区/types";

import { 尝试发送地区信号塔通报 } from "#ctx/beacon/地区/发送";

/**
 * 地区刷新信号塔参数（向后兼容）
 */
export interface 地区刷新信号塔参数 {
    刷新工业地区数量: number;
    刷新炼钢空闲数量: number;
    刷新电解铝空闲数量: number;
}

/**
 * 发送地区刷新事件通报
 * 可同时用于新接口（传入Omit<地区刷新事件参数, '类型'>）和向后兼容（传入地区刷新信号塔参数）
 */
export async function 尝试发送地区刷新信号塔通报(
    ctx: Context,
    参数: 地区刷新信号塔参数,
): Promise<地区信号塔通报结果 | null> {
    return await 尝试发送地区信号塔通报(ctx, {
        类型: "refresh",
        刷新工业地区数量: 参数.刷新工业地区数量,
        刷新炼钢空闲数量: 参数.刷新炼钢空闲数量,
        刷新电解铝空闲数量: 参数.刷新电解铝空闲数量,
    } as 地区刷新事件参数);
}
