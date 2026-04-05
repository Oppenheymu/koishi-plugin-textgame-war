import { Context, Session } from "koishi";
import { Player, PlayerConfig } from "../../types/index";
import { 会话检查 } from "./用户会话检查";
import { 用户检查 } from "./用户平台检查";
import { 获取玩家展示名称 } from "./获取玩家名称";

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
        username: 获取玩家展示名称(PlayerConfig),
        用户资料: Player,
        用户配置: PlayerConfig,
    };
}
