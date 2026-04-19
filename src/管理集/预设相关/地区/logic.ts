import {
    type CapacityBase,
    type CapacityLimit,
    type RegionBasicDataItem,
    TerrainType,
} from './types';
import { 赤道格子面积 } from '@/utils';

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function 归一化占比(value: number): number {
    if (value <= 0) return 0;
    if (value > 1) return clamp(value / 100, 0, 1);
    return value;
}

const CAPACITY_BASELINE: Partial<Record<TerrainType, CapacityBase>> = {
    [TerrainType.平原]: {
        基础设施: 12_000_000,
        公路: 18_000_000,
        机场: 6_000_000,
        港口: 6_000_000,
        居民区: 20_000_000,
        仓库: 15_000_000,
    },
    [TerrainType.高原]: {
        基础设施: 9_000_000,
        公路: 12_000_000,
        机场: 7_000_000,
        港口: 4_000_000,
        居民区: 12_000_000,
        仓库: 11_000_000,
    },
    [TerrainType.浅丘]: {
        基础设施: 8_000_000,
        公路: 10_000_000,
        机场: 5_000_000,
        港口: 3_000_000,
        居民区: 10_000_000,
        仓库: 9_000_000,
    },
    [TerrainType.深丘]: {
        基础设施: 6_000_000,
        公路: 8_000_000,
        机场: 4_000_000,
        港口: 2_000_000,
        居民区: 8_000_000,
        仓库: 7_000_000,
    },
    [TerrainType.低山]: {
        基础设施: 5_000_000,
        公路: 6_000_000,
        机场: 4_000_000,
        港口: 1_500_000,
        居民区: 6_000_000,
        仓库: 6_000_000,
    },
    [TerrainType.中山]: {
        基础设施: 4_000_000,
        公路: 5_000_000,
        机场: 3_000_000,
        港口: 1_200_000,
        居民区: 5_000_000,
        仓库: 5_000_000,
    },
    [TerrainType.高山]: {
        基础设施: 3_000_000,
        公路: 3_000_000,
        机场: 2_000_000,
        港口: 800_000,
        居民区: 3_000_000,
        仓库: 4_000_000,
    },
};
const DEFAULT_CAPACITY: CapacityBase = {
    基础设施: 0,
    公路: 0,
    机场: 0,
    港口: 0,
    居民区: 0,
    仓库: 0,
};

function 获取容量基线(地形: TerrainType): CapacityBase {
    return CAPACITY_BASELINE[地形] ?? DEFAULT_CAPACITY;
}

function 计算面积系数(面积平方公里: number): number {
    if (面积平方公里 <= 0) return 0;
    return clamp(面积平方公里 / 赤道格子面积, 0.05, 1.2);
}

export function 获取容量上限(
    地区: RegionBasicDataItem,
    地形: TerrainType,
    面积平方公里?: number
): CapacityLimit {
    if (地区.isOcean) {
        return {
            基础设施上限: 0,
            公路容量上限: 0,
            机场容量上限: 0,
            港口容量上限: 0,
            居民区容量上限: 0,
            仓库容量上限: 0,
        };
    }

    const 基线 = 获取容量基线(地形);
    const 水域占比 = 归一化占比(地区.Water);
    const 草地占比 = 归一化占比(地区.Grassland);
    const 森林占比 = 归一化占比(地区.Forest);
    const 城镇占比 = 归一化占比(地区.Urban);

    const 海拔系数 =
        地区.MeanElevation >= 2500
            ? 0.78
            : 地区.MeanElevation >= 1500
              ? 0.88
              : 地区.MeanElevation >= 800
                ? 0.95
                : 1.05;
    const 崎岖系数 = clamp(1 - 地区.STDElevation / 4500, 0.55, 1.08);
    const 地貌系数 = clamp(
        0.9 + 草地占比 * 0.18 + 森林占比 * 0.08 + 城镇占比 * 0.15,
        0.85,
        1.25
    );
    const 面积系数 = 面积平方公里 != null ? 计算面积系数(面积平方公里) : 1;
    const 综合系数 = 海拔系数 * 崎岖系数 * 地貌系数 * 面积系数;

    const 港口系数 = 水域占比 <= 0 ? 0 : clamp(0.2 + 水域占比 * 1.2, 0.2, 1.2);

    return {
        基础设施上限: Math.round(基线.基础设施 * 综合系数),
        公路容量上限: Math.round(基线.公路 * 综合系数),
        机场容量上限: Math.round(基线.机场 * 综合系数),
        港口容量上限:
            水域占比 <= 0 ? 0 : Math.round(基线.港口 * 综合系数 * 港口系数),
        居民区容量上限: Math.round(基线.居民区 * 综合系数),
        仓库容量上限: Math.round(基线.仓库 * 综合系数),
    };
}
