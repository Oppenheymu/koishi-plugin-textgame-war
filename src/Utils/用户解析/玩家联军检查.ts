import { Context, Session } from "koishi";
import { CoalitionArmy, Player, PlayerConfig } from "../../types/index";
import { 会话检查 } from "./用户会话检查";
import { 玩家检查 } from "./玩家数据检查";
import { 获取联军权限等级 } from "./获取玩家权限";
import { 联军权限等级 } from "./types";

export async function 玩家联军检查(
    ctx: Context,
    session: Session | undefined,
    options?: {
        最低权限等级?: 联军权限等级;
        是否必须在成员列表?: boolean;
    },
): Promise<{
    id: number;
    uid: string;
    username: string;
    用户资料: Player;
    用户配置: PlayerConfig;
    联军资料: CoalitionArmy;
    联军编号: string;
    权限等级: 联军权限等级;
}> {
    会话检查(session);

    const 玩家结果 = await 玩家检查(ctx, session);

    const 联军编号 = 玩家结果.用户资料.所在联军;
    if (!联军编号) {
        session.send(`你不在任何联军中`);
        throw new Error("玩家不在联军中");
    }

    const [联军资料] = await ctx.database.get("马列联军表", {
        联军编号,
    });

    if (!联军资料) {
        session.send(`数据异常：已记录所在联军但未找到联军档案，请联系管理员`);
        throw new Error("联军档案不存在");
    }

    const 是否必须在成员列表 = options?.是否必须在成员列表 ?? true;
    if (是否必须在成员列表 && !联军资料.联军成员列表?.[玩家结果.uid]) {
        session.send(`数据异常：你不在联军成员列表中，请联系管理员`);
        throw new Error("联军成员数据异常");
    }

    const 权限等级 = 获取联军权限等级(联军资料, 玩家结果.uid);
    const 最低权限等级 = options?.最低权限等级;

    if (typeof 最低权限等级 === "number" && 权限等级 < 最低权限等级) {
        session.send(`权限不足，需要联军${最低权限等级}级及以上权限`);
        throw new Error("联军权限不足");
    }

    return {
        ...玩家结果,
        联军资料,
        联军编号,
        权限等级,
    };
}
