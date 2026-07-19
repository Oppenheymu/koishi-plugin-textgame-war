import type { TerrainType } from "#/types";
import { 计算真实距离 } from "./距离计算";

const 地形移动系数: Record<TerrainType, number> = {
    浅海: 3.0,
    中海: 4.0,
    深海: 5.0,
    超深海: 6.0,
    平原: 1.0,
    高原: 1.2,
    浅丘: 1.3,
    深丘: 1.5,
    低山: 1.8,
    中山: 2.2,
    高山: 3.0,
};

export function 获取地形移动系数(地形: TerrainType): number {
    return 地形移动系数[地形] ?? 1.5;
}

export function 计算旅行时间(
    地区编号A: string,
    地区编号B: string,
    速度公里每天: number,
    起点地形?: TerrainType,
    终点地形?: TerrainType,
): number {
    if (速度公里每天 <= 0) {
        throw new Error("速度必须大于 0");
    }

    const 距离 = 计算真实距离(地区编号A, 地区编号B);
    let 地形系数 = 1.0;
    if (起点地形) 地形系数 = Math.max(地形系数, 获取地形移动系数(起点地形));
    if (终点地形) 地形系数 = Math.max(地形系数, 获取地形移动系数(终点地形));

    const 天数 = (距离 * 地形系数) / 速度公里每天;
    return Math.ceil(天数 * 10) / 10;
}

export const DEFAULT_MARCH_SPEED = 40;
export const DEFAULT_AIR_SPEED = 2000;
