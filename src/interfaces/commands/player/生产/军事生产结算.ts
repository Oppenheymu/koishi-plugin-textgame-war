import { type 物品属性, 物品库 } from "#/interfaces/commands/player/生产/军事生产物品库";
import type { Player, PlayerWarData } from "#ctx/player";
import { 格式化 } from "#shared/format";

/** 本次生产的消耗清单（含按生产力折算的工资） */
export interface 生产消耗 {
    所需生产力: number;
    所需钢铁: number;
    所需金属铝: number;
    工资: number;
}

/** 校验生产请求参数与玩家生产状态，不合法时返回提示文本 */
export function 校验生产请求(
    物品: string | undefined,
    数量: number | undefined,
    用户资料: Player,
): string | undefined {
    if (!物品) {
        return `
====[军事生产]====
□ 格式：
'军事生产 物品 数量'
□ 可生产物品：
${Object.keys(物品库).join("、")}
`.trim();
    }
    if (!数量) return "请指定要生产的数量";
    if (数量 <= 0 || !Number.isInteger(数量)) return "请输入有效的数量";
    if (用户资料.生产次数 <= 0) return "生产次数不足";
    return undefined;
}

/** 计算本次生产所需资源、生产力与工资（步兵装备按每 100 件一批结算） */
export function 计算生产消耗(
    物品: string,
    数量: number,
    物品类型: 物品属性,
    用户资料: Player,
): 生产消耗 {
    let 所需生产力 = 物品类型.生产力需求 * 数量;
    let 所需钢铁 = (物品类型.资源需求.钢铁 || 0) * 数量;
    const 所需金属铝 = (物品类型.资源需求.金属铝 || 0) * 数量;

    // 步兵装备按"每100件消耗1钢铁、10000生产力"结算
    if (物品 === "步兵装备") {
        const 生产批次 = 数量 / 100;
        所需钢铁 = 生产批次;
        所需生产力 = 物品类型.生产力需求 * 生产批次;
    }

    // 按本次所需生产力折算参与生产工人，并据此结算工资
    const 所需工人 = Math.ceil(所需生产力 / 用户资料.生产技术);
    const 工资 = 所需工人 * 用户资料.工人工资;

    return { 所需生产力, 所需钢铁, 所需金属铝, 工资 };
}

/** 校验生产力与资源是否充足，不足时返回提示文本 */
export function 校验生产资源(用户资料: Player, 消耗: 生产消耗): string | undefined {
    const 现有生产力 = 用户资料.工人 * 用户资料.生产技术;
    if (现有生产力 < 消耗.所需生产力) {
        return `生产力不足！需要 ${格式化(消耗.所需生产力)}, 现有 ${格式化(现有生产力)}`;
    }
    if (消耗.工资 > 0 && 用户资料.生活资料 < 消耗.工资) {
        return `生活资料不足！需要 ${格式化(消耗.工资)}, 现有 ${格式化(用户资料.生活资料)}`;
    }
    if (消耗.所需钢铁 > 0 && 用户资料.钢铁 < 消耗.所需钢铁) {
        return `钢铁不足！需要 ${格式化(消耗.所需钢铁)}, 现有 ${格式化(用户资料.钢铁)}`;
    }
    if (消耗.所需金属铝 > 0 && 用户资料.金属铝 < 消耗.所需金属铝) {
        return `金属铝不足！需要 ${格式化(消耗.所需金属铝)}, 现有 ${格式化(用户资料.金属铝)}`;
    }
    return undefined;
}

/** 组装消耗明细文本 */
export function 构建消耗明细(消耗: 生产消耗): string[] {
    const 消耗明细: string[] = [];
    if (消耗.所需钢铁 > 0) 消耗明细.push(`■ 钢铁：-${格式化(消耗.所需钢铁)}`);
    if (消耗.所需金属铝 > 0) 消耗明细.push(`■ 金属铝：-${格式化(消耗.所需金属铝)}`);
    消耗明细.push(`■ 生活资料：-${格式化(消耗.工资)}`);
    return 消耗明细;
}

/** 构建扣除消耗、累加库存后的数据库更新数据 */
export function 构建更新数据(
    用户资料: Player & PlayerWarData,
    消耗: 生产消耗,
    属性名: keyof PlayerWarData,
    数量: number,
): Partial<Player & PlayerWarData> {
    const 更新数据: Partial<Player & PlayerWarData> = {
        钢铁: 用户资料.钢铁 - 消耗.所需钢铁,
        金属铝: 用户资料.金属铝 - 消耗.所需金属铝,
        生活资料: 用户资料.生活资料 - 消耗.工资,
        生产次数: 用户资料.生产次数 - 1,
    };

    // 添加生产的物品
    const 当前库存 = Number(用户资料[属性名] ?? 0);
    Object.assign(更新数据, {
        [属性名]: 当前库存 + 数量,
    });

    return 更新数据;
}

/** 组装生产成功的结果文本 */
export function 组装生产结果文本(
    username: string,
    数量: number,
    物品名: string,
    消耗明细: string[],
): string {
    return `
====[军事生产]====
${username} 同志：
成功生产 ${数量} 个 ${物品名}
${消耗明细.join("\n")}
`.trim();
}
