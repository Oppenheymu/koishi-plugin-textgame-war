// 军事查询指令共用辅助（格式化 / 权限校验 / 用户名缓存）
import type { Context } from "koishi";
import type { 玩家联军检查 } from "#ctx/coalition";
import { 获取联军操作权限, 获取联军权限等级 } from "#ctx/coalition";
import { 玩家检查 } from "#ctx/player";

export const 格式化 = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

export async function 校验查看他国军队权限(
    ctx: Context,
    session: Parameters<typeof 玩家联军检查>[1],
    军队联军编号: string,
): Promise<string | null> {
    const { uid, 用户资料 } = await 玩家检查(ctx, session);
    if (用户资料.所在联军 === 军队联军编号) {
        return null;
    }
    if (!用户资料.所在联军) {
        return "你不在任何联军中，无法查看他国军队";
    }
    const [联军资料] = await ctx.database.get("征战联军表", {
        联军编号: 用户资料.所在联军,
    });
    if (!联军资料) {
        return "联军数据异常";
    }
    const 权限等级 = 获取联军权限等级(联军资料, uid);
    const 所需等级 = await 获取联军操作权限(ctx, 用户资料.所在联军, "查看地区军事");
    if (权限等级 < 所需等级) {
        return `查看他国军队需要本联军 ${所需等级} 级及以上权限`;
    }
    return null;
}

export async function 获取用户名缓存(
    ctx: Context,
    uid列表: (string | null)[],
): Promise<Map<string, string>> {
    const 缓存 = new Map<string, string>();
    await Promise.all(
        Array.from(new Set(uid列表.filter(Boolean) as string[])).map(async (uid) => {
            const [配置] = await ctx.database.get("征战玩家配置表", {
                uid,
            });
            缓存.set(uid, 配置?.username ?? uid);
        }),
    );
    return 缓存;
}
