// 军事系统可调参数常量区（详见 军事系统.prompt.md，所有数值均可调）
// 直接从具体模块导入，避免经 #/types barrel 造成循环依赖

import { 联军政体 } from "#ctx/coalition";
import { 军衔 } from "#ctx/military/domain/types/枚举";

import { TerrainType } from "#ctx/region";

// ---- 军衔体系（第 2 章）----

export interface 军衔权益 {
    可建军数量: number; // Infinity = 不限
    单军兵力上限: number; // Infinity = 不限
}

export const 军衔权益表: Record<军衔, 军衔权益> = {
    [军衔.少尉]: { 可建军数量: 1, 单军兵力上限: 5_000 },
    [军衔.上尉]: { 可建军数量: 1, 单军兵力上限: 10_000 },
    [军衔.少校]: { 可建军数量: 2, 单军兵力上限: 20_000 },
    [军衔.上校]: { 可建军数量: 3, 单军兵力上限: 50_000 },
    [军衔.少将]: { 可建军数量: Infinity, 单军兵力上限: Infinity },
};

/**
 * 政体联动：元首自动军衔（无条目 = 无军衔，军政分离）
 * 民主制元首是文官；威权制军政有限分离；极权制军政合一最高统帅
 */
export const 政体元首自动军衔: Partial<Record<联军政体, 军衔>> = {
    [联军政体.威权制]: 军衔.上校,
    [联军政体.极权制]: 军衔.少将,
};

// ---- 属性聚合（第 4 章）----

/** 折算"营"数的人数基数（组织度/硬度加权平均用） */
export const 营折算人数 = 500;

/** 全员摩托化判定：卡车数 ≥ 士兵数 × 该比例时步兵不再拖速度 */
export const 摩托化卡车比例 = 0.05;

/** 摩托化后的速度上限（卡车速度） */
export const 摩托化速度 = 12;

/** 组织度低于该值时展示层提示"一打就溃" */
export const 组织度警告线 = 25;

// ---- 移动系统（第 5 章）----

/**
 * 时间倍率：现实 1 小时 = 游戏内多少小时
 * 默认 144（现实 1 小时 = 游戏 6 天），用于把真实公里折算成文游节奏的行军时间
 */
export const 时间倍率 = 144;

/** 地形速度修正（7 种陆地地形） */
export const 地形速度修正: Partial<Record<TerrainType, number>> = {
    [TerrainType.平原]: 1.0,
    [TerrainType.高原]: 0.9,
    [TerrainType.浅丘]: 0.85,
    [TerrainType.深丘]: 0.7,
    [TerrainType.低山]: 0.6,
    [TerrainType.中山]: 0.45,
    [TerrainType.高山]: 0.3,
};

/** 地貌速度修正（6 种，按占比加权） */
export const 地貌速度修正 = {
    水域: 0.5,
    雪地: 0.6,
    草地: 1.0,
    荒地: 0.9,
    森林: 0.75,
    城镇: 1.1,
} as const;

/** 目标地区水域占比超过该值时需要两栖装备 */
export const 水域进入占比阈值 = 0.5;

/** 进入高水域地区所需的两栖装备乘员占比 */
export const 两栖乘员占比要求 = 0.3;

// ---- 战斗系统（第 6 章）----

/** 地形基础战场宽度 */
export const 地形基础宽度: Partial<Record<TerrainType, number>> = {
    [TerrainType.平原]: 80,
    [TerrainType.高原]: 75,
    [TerrainType.浅丘]: 70,
    [TerrainType.深丘]: 60,
    [TerrainType.低山]: 55,
    [TerrainType.中山]: 45,
    [TerrainType.高山]: 35,
};

/** 战场宽度上下限 */
export const 战场宽度下限 = 30;
export const 战场宽度上限 = 120;

/** 超宽惩罚上限（负值比例） */
export const 超宽惩罚上限 = 0.33;

/** 攻击点数离散化除数（钢4：攻击点数 = round(有效攻击 ÷ 10)） */
export const 攻击点数除数 = 10;

/** 未破防命中率 / 破防命中率 */
export const 未破防命中率 = 0.1;
export const 破防命中率 = 0.4;

/** 穿甲四档伤害系数 */
export const 穿甲伤害系数表 = {
    完全穿透: 1.0, // 穿甲比 ≥ 100%
    大部分穿透: 0.8, // 75% ~ 99%
    部分穿透: 0.65, // 50% ~ 74%
    无法穿透: 0.5, // < 50%
} as const;

/** 装甲优势判定的攻击方硬度阈值 */
export const 装甲优势硬度阈值 = 0.5;

/** 组织度伤害基础骰子（装甲优势时上限提升为 6） */
export const 组织度伤害骰子最小 = 1;
export const 组织度伤害骰子众数 = 2;
export const 组织度伤害骰子最大 = 4;
export const 装甲优势骰子最大 = 6;
export const 组织度伤害系数 = 0.053;

/** HP 伤害基础骰子与系数 */
export const HP伤害骰子最小 = 1;
export const HP伤害骰子众数 = 1.5;
export const HP伤害骰子最大 = 2;
export const HP伤害系数 = 0.06;

/** 地形攻击修正（进攻方惩罚，7 种陆地地形） */
export const 地形攻击修正: Partial<Record<TerrainType, number>> = {
    [TerrainType.平原]: 1.0,
    [TerrainType.高原]: 0.95,
    [TerrainType.浅丘]: 0.9,
    [TerrainType.深丘]: 0.8,
    [TerrainType.低山]: 0.7,
    [TerrainType.中山]: 0.55,
    [TerrainType.高山]: 0.4,
};

/** 地貌攻击修正（进攻方惩罚，6 种，按占比加权） */
export const 地貌攻击修正 = {
    水域: 0.6,
    雪地: 0.8,
    草地: 1.0,
    荒地: 0.95,
    森林: 0.85,
    城镇: 0.9,
} as const;

/** 死守时组织度归零后每轮额外承受的 HP 伤害倍率 */
export const 死守HP伤害倍率 = 1.5;

/** 战斗结束后 HP 损失转化为装备/士兵永久损失的比例 */
export const HP损失转化率 = 0.7;

/** 脱战军队每轮组织度恢复量（比例） */
export const 组织度恢复速率 = 0.05;

/** 在本国控制地区驻扎时组织度恢复倍率 */
export const 友方领土恢复倍率 = 2;

/** 经验值累积：每轮参战 经验值 += 造成组织度伤害 × 该系数 */
export const 经验累积系数 = 0.01;

/** 经验修正上限：伤害加成上限 +50% */
export const 经验修正上限 = 0.5;

/** 经验修正除数：经验修正 = 1 + min(上限, 经验值 ÷ 该值) */
export const 经验修正除数 = 1000;

/** 战报是否显示精确数值（false = 模糊分级，给观众想象空间） */
export const 战报显示精确数值 = false;
