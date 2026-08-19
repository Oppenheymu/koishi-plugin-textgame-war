import type { 新闻信号塔发送结果 } from "#ctx/beacon/domain/news/types";

/**
 * 地区刷新事件参数
 */
export interface 地区刷新事件参数 {
    类型: "refresh";
    刷新工业地区数量: number;
    刷新炼钢空闲数量: number;
    刷新电解铝空闲数量: number;
}

/**
 * 地区权限变更事件参数
 */
export interface 地区权限变更事件参数 {
    类型: "permission";
    操作类型: "设置总督" | "设置司令";
    玩家名称: string;
    地区名称: string;
    地区编号: string;
    操作者: string;
}

export interface 地区战争事件参数 {
    类型: "war";
    战争类型: "列车炮炮击";
    发起者: string;
    发起地区名称: string;
    发起地区编号: string;
    目标地区名称: string;
    目标地区编号: string;
    投入数量: number;
    破坏概要: string;
}

export type 地区信号塔事件参数 = 地区刷新事件参数 | 地区权限变更事件参数 | 地区战争事件参数;

/**
 * 地区信号塔通报结果
 */
export type 地区信号塔通报结果 = 新闻信号塔发送结果;
