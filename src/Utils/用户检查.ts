import { Session, Context } from "koishi";
import { CoalitionArmy, Player, PlayerConfig } from "../Types/index";

export function 会话检查(
    session: Session | undefined,
): asserts session is Session {
    if (!session) {
        throw new Error("无法获取会话信息");
    }
}

export function 用户检查(session: Session | undefined): {
    platform: string;
    userId: string;
} {
    会话检查(session);

    const validPlatforms: string[] = ["onebot", "discord", "telegram"];

    if (!session.platform || !validPlatforms.includes(session.platform)) {
        throw new Error("无法获取平台信息/或平台不受支持");
    }

    if (!session.userId) {
        throw new Error("无法获取用户信息");
    }

    return {
        platform: session.platform,
        userId: session.userId,
    };
}

export async function 玩家检查(
    ctx: Context,
    session: Session | undefined,
): Promise<{
    id: number;
    uid: string;
    username: string;
    用户资料: Player;
    用户配置: PlayerConfig;
}> {
    会话检查(session);

    const { platform, userId } = 用户检查(session);

    const [PlayerConfig] = await ctx.database.get("马列玩家配置表", {
        [platform]: userId,
    });
    if (!PlayerConfig) {
        session.send(`同志，你还未注册`);
        throw new Error("玩家未注册");
    }

    const [Player] = await ctx.database.get("马列玩家表", {
        id: PlayerConfig.id,
    });
    if (!Player) {
        session.send(`数据异常：已找到账号但未发现玩家档案，请联系管理员`);
        throw new Error("玩家档案不存在");
    }

    return {
        id: PlayerConfig.id,
        uid: PlayerConfig.uid,
        username: PlayerConfig.username,
        用户资料: Player,
        用户配置: PlayerConfig,
    };
}

export type 联军权限等级 = 0 | 1 | 2 | 3;

export function 获取联军权限等级(
    联军资料: CoalitionArmy,
    uid: string,
): 联军权限等级 {
    if (联军资料.联军元首 === uid || 联军资料.联军总理 === uid) {
        return 1;
    }

    if (联军资料.联军一级权限成员列表.includes(uid)) {
        return 1;
    }

    if (联军资料.联军二级权限成员列表.includes(uid)) {
        return 2;
    }

    if (联军资料.联军三级权限成员列表.includes(uid)) {
        return 3;
    }

    return 0;
}

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

//一行搞定：会话检查 + 用户检查 + 玩家存在检查，太强啦。验证玩家会话并获取基础信息
//const { uid, username, 用户资料} = await 玩家检查(ctx, session);
//联军场景：会自动附带联军资料 + 权限等级。验证玩家会话并获取玩家联军信息
//const { uid, username, 用户资料, 联军资料, 权限等级 } = await 玩家联军检查(ctx, session);
