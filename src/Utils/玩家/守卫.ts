import type { Context, Session } from "koishi";
import type { 玩家解析结果 } from "../types.js";
import { 会话检查, 发送并抛出错误 } from "../会话/index.js";
import { 获取玩家展示名称 } from "./名称.js";
import { 合并玩家资料 } from "./查询.js";

export async function 玩家检查(ctx: Context, session: Session | undefined): Promise<玩家解析结果> {
    会话检查(session);

    const platform = session.platform;
    const userId = session.userId;

    const [玩家配置记录] = await ctx.database.get("马列玩家配置表", {
        [platform]: userId,
    });

    if (!玩家配置记录) {
        return 发送并抛出错误(session, "同志，你还未注册", "玩家未注册");
    }

    const [[玩家档案记录], [玩家战争记录]] = await Promise.all([
        ctx.database.get("马列玩家表", { id: 玩家配置记录.id }),
        ctx.database.get("马列玩家战争表", { id: 玩家配置记录.id }),
    ]);

    if (!玩家档案记录) {
        return 发送并抛出错误(
            session,
            "数据异常：已找到账号但未发现玩家档案，请联系管理员",
            "玩家档案不存在",
        );
    }

    if (!玩家战争记录) {
        return 发送并抛出错误(
            session,
            "数据异常：已找到账号但未发现玩家战争档案，请联系管理员",
            "玩家战争档案不存在",
        );
    }

    return {
        id: 玩家配置记录.id,
        uid: 玩家配置记录.uid,
        username: 获取玩家展示名称(玩家配置记录),
        用户资料: 合并玩家资料(玩家档案记录, 玩家战争记录),
        用户配置: 玩家配置记录,
    };
}
