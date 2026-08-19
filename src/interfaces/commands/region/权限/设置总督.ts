import type { Context, Session } from "koishi";
import { 尝试发送地区信号塔通报, 尝试发送联军信号塔通报 } from "#ctx/beacon";
import { 地区总督设置检查, 更新地区资料 } from "#ctx/region";

async function 执行设置总督(
    ctx: Context,
    session: Session | undefined,
    目标玩家参数: string | undefined,
    地区编号参数: string | undefined,
): Promise<string> {
    const 目标玩家名称 = 目标玩家参数?.trim();
    if (!目标玩家名称) {
        return "请指定目标玩家名称";
    }

    const { username, 地区编号, 展示地区名称, 地区资料 } = await 地区总督设置检查(
        ctx,
        session,
        地区编号参数,
    );

    const 原总督 = (地区资料.地区总督 ?? "").trim();
    if (原总督 === 目标玩家名称) {
        return `${展示地区名称}（${地区编号}）已经是 ${目标玩家名称} 担任总督`;
    }

    await 更新地区资料(ctx, 地区编号, {
        地区总督: 目标玩家名称,
    });

    const 地区所属联军 = 地区资料.控制国家?.trim();
    if (地区所属联军) {
        await 尝试发送联军信号塔通报(ctx, {
            联军编号: 地区所属联军,
            通报标题: "地区政务变更",
            通报内容: `${username} 在 ${展示地区名称}（${地区编号}）任免地区总督为 ${目标玩家名称}`,
        });
    }

    // 发送地区信号塔通报（全局播报）
    await 尝试发送地区信号塔通报(ctx, {
        类型: "permission",
        操作类型: "设置总督",
        玩家名称: 目标玩家名称,
        地区名称: 展示地区名称,
        地区编号,
        操作者: username,
    });

    return `
====[征战文游]====
${username} 同志！
地区总督已更新
■ 地区：${展示地区名称}（${地区编号}）
■ 原总督：${原总督 || "暂无"}
■ 新总督：${目标玩家名称}
`.trim();
}

export function 设置总督(ctx: Context) {
    ctx.command("设置总督 <目标玩家:string> [地区编号:string]")
        .alias("任命总督")
        .alias("地区总督")
        .action(async ({ session }, 目标玩家参数, 地区编号参数) => {
            try {
                return await 执行设置总督(ctx, session, 目标玩家参数, 地区编号参数);
            } catch (error) {
                return (error as Error).message;
            }
        });
}
