import { Context } from "koishi";
import type {
    Player,
    PlayerBasicData,
    PlayerWarData,
    PlayerWarRecord,
} from "../../../types";

const 玩家战争字段列表 = [
    "私人军队",
    "重炮",
    "火箭炮",
    "火箭炮弹药",
    "防空弹药",
    "侦察机",
    "轰炸机",
    "隐形轰炸机",
    "大型运输机",
    "小型运输机",
    "预警机",
    "巡航中的预警机",
    "战斗机",
    "巡航中的战斗机",
    "地下工厂投入",
    "是否有地下工厂",
    "地下机库投入",
    "是否有地下机库",
    "地下弹药库投入",
    "是否有地下弹药库",
    "地下飞机",
    "地下隐形飞机",
    "地下预警机",
    "地下大型运输机",
    "地下小型运输机",
    "地下火箭炮炮弹",
    "地下防空弹药",
] as const satisfies readonly (keyof PlayerWarData)[];

const 玩家战争字段集合 = new Set<string>(玩家战争字段列表);

export function 拆分玩家更新(更新: Partial<Player>): {
    基础资料更新: Partial<PlayerBasicData>;
    战争资料更新: Partial<PlayerWarData>;
} {
    const 基础资料更新: Partial<PlayerBasicData> = {};
    const 战争资料更新: Partial<PlayerWarData> = {};

    for (const [字段, 值] of Object.entries(更新) as [
        keyof Player,
        Player[keyof Player]
    ][]) {
        if (玩家战争字段集合.has(字段)) {
            (战争资料更新 as Record<string, unknown>)[字段] = 值;
        } else {
            (基础资料更新 as Record<string, unknown>)[字段] = 值;
        }
    }

    return {
        基础资料更新,
        战争资料更新,
    };
}

export async function 获取玩家完整资料(
    ctx: Context,
    id: number
): Promise<Player | null> {
    const [基础资料] = await ctx.database.get("马列玩家表", { id });
    if (!基础资料) return null;

    const [战争资料] = await ctx.database.get("马列玩家战争表", { id });
    if (!战争资料) return null;

    const { id: _战争数据ID, uid: _战争数据UID, ...纯战争资料 } = 战争资料;

    return {
        ...基础资料,
        ...纯战争资料,
    };
}

export async function 更新玩家资料(
    ctx: Context,
    id: number,
    更新: Partial<Player>
): Promise<void> {
    const { 基础资料更新, 战争资料更新 } = 拆分玩家更新(更新);
    const 更新任务: Promise<unknown>[] = [];

    if (Object.keys(基础资料更新).length > 0) {
        更新任务.push(ctx.database.set("马列玩家表", { id }, 基础资料更新));
    }

    if (Object.keys(战争资料更新).length > 0) {
        更新任务.push(ctx.database.set("马列玩家战争表", { id }, 战争资料更新));
    }

    await Promise.all(更新任务);
}

export async function 创建玩家资料(
    ctx: Context,
    基础资料: PlayerBasicData,
    战争资料: PlayerWarRecord
): Promise<void> {
    await Promise.all([
        ctx.database.create("马列玩家表", 基础资料),
        ctx.database.create("马列玩家战争表", 战争资料),
    ]);
}
