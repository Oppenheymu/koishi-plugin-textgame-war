import type { Context, Session } from "koishi";
import { 获取联军权限等级 } from "#ctx/coalition/domain/权限";

import { 玩家检查 } from "#ctx/player";
import type { 玩家联军检查选项, 玩家联军解析结果 } from "#shared/kernel/跨域类型";
import { 会话检查, 发送并抛出错误 } from "#shared/session";

export async function 玩家联军检查(
    ctx: Context,
    session: Session | undefined,
    options?: 玩家联军检查选项,
): Promise<玩家联军解析结果> {
    会话检查(session);

    const 玩家结果 = await 玩家检查(ctx, session);

    const 联军编号 = 玩家结果.用户资料.所在联军;
    if (!联军编号) {
        return 发送并抛出错误(session, "你不在任何联军中", "玩家不在联军中");
    }

    const [联军资料] = await ctx.database.get("马列联军表", { 联军编号 });
    if (!联军资料) {
        return 发送并抛出错误(
            session,
            "数据异常：已记录所在联军但未找到联军档案，请联系管理员",
            "联军档案不存在",
        );
    }

    const 是否必须在成员列表 = options?.是否必须在成员列表 ?? true;
    if (是否必须在成员列表 && !联军资料.联军成员列表?.[玩家结果.uid]) {
        return 发送并抛出错误(
            session,
            "数据异常：你不在联军成员列表中，请联系管理员",
            "联军成员数据异常",
        );
    }

    const 权限等级 = 获取联军权限等级(联军资料, 玩家结果.uid);
    const 最低权限等级 = options?.最低权限等级;

    if (typeof 最低权限等级 === "number" && 权限等级 < 最低权限等级) {
        return 发送并抛出错误(
            session,
            `权限不足，需要联军${最低权限等级}级及以上权限`,
            "联军权限不足",
        );
    }

    return {
        ...玩家结果,
        联军资料,
        联军编号,
        权限等级,
    };
}
