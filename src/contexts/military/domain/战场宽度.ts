// 战场宽度与地形地貌修正（纯函数，不落表，详见 军事系统.prompt.md 5.3 / 6.1）

import {
    地形基础宽度,
    地形攻击修正,
    地形速度修正,
    地貌攻击修正,
    地貌速度修正,
    战场宽度上限,
    战场宽度下限,
    超宽惩罚上限,
} from "#ctx/military/domain/types/常量";

import type { RegionTerra, TerrainType } from "#ctx/region";

type 地貌占比 = Pick<RegionTerra, "水域" | "雪地" | "草地" | "荒地" | "森林" | "城镇">;

/** 战场宽度 = 基础宽度 × (1 + 0.3×城镇 - 0.2×森林 - 0.3×水域)，clamp(30, 120)
 *  地貌值以百分比(0-100)存入数据库，此处归一化为(0-1) */
const 归一化 = (v: number | undefined | null) => (v ?? 0) / 100;

export function 计算战场宽度(地形: TerrainType, 地貌: 地貌占比): number {
    const 基础宽度 = 地形基础宽度[地形] ?? 80;
    const 宽度 =
        基础宽度 *
        (1 + 0.3 * 归一化(地貌.城镇) - 0.2 * 归一化(地貌.森林) - 0.3 * 归一化(地貌.水域));
    return Math.min(战场宽度上限, Math.max(战场宽度下限, 宽度));
}

/** 地貌加权修正：Σ(归一化占比[k] × 修正表[k])，不足 1 时按草地补满
 *  注意：数据库存储百分比（0-100），此处内部归一化 */
function 地貌加权修正(地貌: 地貌占比, 修正表: Record<string, number>): number {
    const 占比条目: [keyof 地貌占比, number][] = [
        ["水域", 地貌.水域],
        ["雪地", 地貌.雪地],
        ["草地", 地貌.草地],
        ["荒地", 地貌.荒地],
        ["森林", 地貌.森林],
        ["城镇", 地貌.城镇],
    ];
    let 加权 = 0;
    let 占比总和 = 0;
    for (const [键, 占比] of 占比条目) {
        const 有效占比 = Math.max(0, (占比 || 0) / 100);
        加权 += 有效占比 * (修正表[键] ?? 1);
        占比总和 += 有效占比;
    }
    if (占比总和 < 1) 加权 += (1 - 占比总和) * 1; // 缺口按基准 1.0 计
    return 加权;
}

/** 单地区地貌速度修正（加权） */
export function 计算地貌速度修正(地貌: 地貌占比): number {
    return 地貌加权修正(地貌, 地貌速度修正);
}

/** 行军地形修正：出发与目标地区地形修正的平均值 */
export function 计算行军地形修正(出发地形: TerrainType, 目标地形: TerrainType): number {
    const 出发 = 地形速度修正[出发地形] ?? 1;
    const 目标 = 地形速度修正[目标地形] ?? 1;
    return (出发 + 目标) / 2;
}

/** 战斗攻击修正（进攻方惩罚）：地形修正 × 地貌加权修正 */
export function 计算攻击地形地貌修正(地形: TerrainType, 地貌: 地貌占比): number {
    const 地形修正 = 地形攻击修正[地形] ?? 1;
    return 地形修正 * 地貌加权修正(地貌, 地貌攻击修正);
}

/** 超宽惩罚（6.2）：未超宽为 0，超宽为负比例，上限 -33%（可调） */
export function 计算超宽惩罚(上场总宽度: number, 战场宽度: number): number {
    if (上场总宽度 <= 战场宽度 || 战场宽度 <= 0) return 0;
    const 惩罚 = -((上场总宽度 - 战场宽度) / 战场宽度);
    return Math.max(-超宽惩罚上限, 惩罚);
}
