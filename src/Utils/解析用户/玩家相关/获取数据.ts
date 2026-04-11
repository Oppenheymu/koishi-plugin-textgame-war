import { Context, Session } from "koishi";
import { 会话检查 } from "../会话相关/会话检查";
import { 用户检查 } from "../会话相关/平台检查";
import { 获取玩家展示名称 } from "./获取名称";
import { 获取玩家完整资料 } from "./玩家数据";
import { 玩家解析结果 } from "../types";
import { 发送并抛出错误 } from "../error";

export async function 玩家检查(
    ctx: Context,
    session: Session | undefined
): Promise<玩家解析结果> {
    会话检查(session);

    const { platform, userId } = 用户检查(session);

    const [玩家配置记录] = await ctx.database.get("马列玩家配置表", {
        [platform]: userId,
    });

    if (!玩家配置记录) {
        return 发送并抛出错误(session, "同志，你还未注册", "玩家未注册");
    }

    const 玩家档案记录 = await 获取玩家完整资料(ctx, 玩家配置记录.id);

    if (!玩家档案记录) {
        return 发送并抛出错误(
            session,
            "数据异常：已找到账号但未发现完整玩家档案，请联系管理员",
            "玩家档案不存在"
        );
    }

    return {
        id: 玩家配置记录.id,
        uid: 玩家配置记录.uid,
        username: 获取玩家展示名称(玩家配置记录),
        用户资料: 玩家档案记录,
        用户配置: 玩家配置记录,
    };
}
