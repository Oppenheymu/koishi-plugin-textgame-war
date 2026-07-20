import type { Context } from "koishi";
import type { Army, CoalitionRank } from "#/types";

/** 军队解析：全局编号（纯数字）→ 军队记录 */
export async function 军队解析(
    ctx: Context,
    编号输入: string | number | undefined,
): Promise<Army> {
    const 编号 = Number(编号输入);
    if (!Number.isInteger(编号) || 编号 <= 0) {
        throw new Error("请指定有效的军队编号（纯数字）");
    }

    const [军队] = await ctx.database.get("马列军队表", { id: 编号 });
    if (!军队) {
        throw new Error(`未找到军队 #${编号}`);
    }
    return 军队;
}

/** 查询玩家在指定联军内的军衔记录 */
export async function 获取联军军衔记录(
    ctx: Context,
    联军编号: string,
    玩家UID: string,
): Promise<CoalitionRank | null> {
    const [记录] = await ctx.database.get("马列联军军衔表", {
        联军编号,
        玩家UID,
    });
    return 记录 ?? null;
}

/** 查询玩家在指定联军内的军衔等级（无军衔返回 0） */
export async function 获取玩家军衔等级(
    ctx: Context,
    联军编号: string,
    玩家UID: string,
): Promise<number> {
    const 记录 = await 获取联军军衔记录(ctx, 联军编号, 玩家UID);
    return 记录?.军衔 ?? 0;
}

/** 查询玩家指挥的军队列表 */
export async function 获取玩家军队列表(
    ctx: Context,
    联军编号: string,
    指挥官UID: string,
): Promise<Army[]> {
    return ctx.database.get("马列军队表", {
        所属联军编号: 联军编号,
        指挥官UID,
    });
}
