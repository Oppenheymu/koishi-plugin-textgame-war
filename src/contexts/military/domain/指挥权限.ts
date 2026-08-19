import type { Context } from "koishi";
import type { Army } from "#ctx/military/domain/types/数据类型";

import { 军衔, 军衔名称映射 } from "#ctx/military/domain/types/枚举";

import { 获取玩家军衔等级 } from "#ctx/military/domain/军队解析";

/**
 * 校验指挥权（设计文档 2.5）：
 * - 指挥官本人 → 可指挥
 * - 无主军队 → 任何人不可指挥（只能被任命）
 * - 本国将官（少将）→ 可指挥本国任何军队
 * 返回 null 表示可指挥，否则返回拒绝原因
 */
async function 校验指挥权(ctx: Context, 军队: Army, 操作者UID: string): Promise<string | null> {
    if (!军队.指挥官UID) {
        return "该军队处于无主状态，请先通过【任命指挥官】指派指挥官";
    }
    if (军队.指挥官UID === 操作者UID) {
        return null;
    }
    const 操作者军衔 = await 获取玩家军衔等级(ctx, 军队.所属联军编号, 操作者UID);
    if (操作者军衔 >= 军衔.少将) {
        return null;
    }
    return "只有指挥官本人或本国将官（少将）才能指挥该军队";
}

/**
 * 校验命令覆盖（命令优先级核心，只比军衔数值）：
 * 新命令需 下达者军衔 ≥ 军队.命令下达者军衔 才能覆盖
 * 返回 null 表示可覆盖，否则返回拒绝原因
 */
function 校验命令覆盖(
    军队: Pick<Army, "当前命令" | "命令下达者军衔">,
    下达者军衔: number,
): string | null {
    if (下达者军衔 >= 军队.命令下达者军衔) {
        return null;
    }
    const 军衔名称 = 军衔名称映射[军队.命令下达者军衔 as 军衔] ?? `${军队.命令下达者军衔}级`;
    return `上级（${军衔名称}）已下达【${军队.当前命令}】命令，你的军衔不足，无法覆盖`;
}

/**
 * 组合校验：指挥权 + 命令覆盖（下达命令类指令统一入口）
 * 返回 { 操作者军衔 } 表示通过；否则抛出 Error
 */
export async function 校验指挥与命令覆盖(
    ctx: Context,
    军队: Army,
    操作者UID: string,
): Promise<{ 操作者军衔: number }> {
    const 指挥权拒绝 = await 校验指挥权(ctx, 军队, 操作者UID);
    if (指挥权拒绝) {
        throw new Error(指挥权拒绝);
    }

    const 操作者军衔 = await 获取玩家军衔等级(ctx, 军队.所属联军编号, 操作者UID);

    const 覆盖拒绝 = 校验命令覆盖(军队, 操作者军衔);
    if (覆盖拒绝) {
        throw new Error(覆盖拒绝);
    }

    return { 操作者军衔 };
}
