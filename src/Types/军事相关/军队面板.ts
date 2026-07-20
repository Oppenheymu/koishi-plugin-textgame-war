import type { 陆军装备名 } from "./装备属性表";

/**
 * 军队面板：由 27 种装备数量 + 士兵数量 聚合得出的战斗属性
 * 纯函数现算，不落库（见 logic/军事相关/属性聚合.ts）
 */
export interface 军队面板 {
    软攻: number;
    硬攻: number;
    突破: number;
    防御: number;
    装甲: number; // 40-60 公式聚合
    穿甲: number; // 40-60 公式聚合
    组织度: number; // 组织度上限（加权平均）
    HP: number; // HP 上限（加和）
    宽度: number;
    速度: number; // 基础速度 km/h（最慢单位）
    硬度: number; // 0~1 装甲率

    // 聚合中间量（展示/调试/战损结算用）
    有效装备数: Partial<Record<陆军装备名, number>>;
    持枪步兵: number;
    无枪士兵: number;
    是否摩托化: boolean; // 卡车数 ≥ 士兵数 × 摩托化卡车比例
}
