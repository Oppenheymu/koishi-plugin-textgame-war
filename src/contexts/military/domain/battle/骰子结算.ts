// 骰子结算（6.3 破防机制 + 6.4 穿甲 + 6.5 伤害公式，详见 军事系统.prompt.md 第 6 章）
// 注意：地形地貌修正在 执行一方输出 的攻击属性阶段已计入（6.2 有效软攻/硬攻），
// 此处不再重复相乘，避免进攻方地形惩罚被平方
import { TRandom } from "#/infrastructure";
import {
    HP伤害系数,
    HP伤害骰子众数,
    HP伤害骰子最大,
    HP伤害骰子最小,
    未破防命中率,
    破防命中率,
    穿甲伤害系数表,
    组织度伤害系数,
    组织度伤害骰子众数,
    组织度伤害骰子最大,
    组织度伤害骰子最小,
    装甲优势骰子最大,
} from "#ctx/military/domain/types/常量";

export interface 交火结果 {
    组织度伤害: number;
    HP伤害: number;
}

/** 穿甲四档伤害系数（6.4） */
export function 计算穿甲伤害系数(攻击方穿甲: number, 目标装甲: number): number {
    if (目标装甲 <= 0) return 穿甲伤害系数表.完全穿透;
    const 穿甲比 = 攻击方穿甲 / 目标装甲;
    if (穿甲比 >= 1) return 穿甲伤害系数表.完全穿透;
    if (穿甲比 >= 0.75) return 穿甲伤害系数表.大部分穿透;
    if (穿甲比 >= 0.5) return 穿甲伤害系数表.部分穿透;
    return 穿甲伤害系数表.无法穿透;
}

/**
 * 交火（6.3 破防机制 + 6.4 穿甲 + 6.5 伤害公式）
 * 随机数用 TRandom 三角分布使伤害更集中（可调：改 Math.random）
 */
export function 执行交火(参数: {
    攻击点数: number;
    防御点数: number;
    穿甲伤害系数: number;
    装甲优势: boolean;
}): 交火结果 {
    const { 攻击点数, 防御点数, 穿甲伤害系数, 装甲优势 } = 参数;

    const 被格挡部分 = Math.min(攻击点数, 防御点数);
    const 破防部分 = Math.max(0, 攻击点数 - 防御点数);
    const 期望命中次数 = 被格挡部分 * 未破防命中率 + 破防部分 * 破防命中率;
    if (期望命中次数 <= 0) return { 组织度伤害: 0, HP伤害: 0 };

    const 组织度骰子最大 = 装甲优势 ? 装甲优势骰子最大 : 组织度伤害骰子最大;
    const 单次组织度伤害 =
        TRandom(组织度伤害骰子最小, 组织度伤害骰子众数, 组织度骰子最大, false) *
        组织度伤害系数 *
        穿甲伤害系数;
    const 单次HP伤害 =
        TRandom(HP伤害骰子最小, HP伤害骰子众数, HP伤害骰子最大, false) * HP伤害系数 * 穿甲伤害系数;

    return {
        组织度伤害: 期望命中次数 * 单次组织度伤害,
        HP伤害: 期望命中次数 * 单次HP伤害,
    };
}
