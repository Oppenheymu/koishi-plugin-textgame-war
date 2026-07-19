import type { Context, Session } from "koishi";
import {
    地区司令设置检查,
    尝试发送地区信号塔通报,
    尝试发送联军信号塔通报,
} from "#/logic";
import { 更新地区战略资料 } from "#/utils";

async function 执行设置司令(
    ctx: Context,
    session: Session | undefined,
    目标玩家参数: string | undefined,
    地区编号参数: string | undefined,
): Promise<string> {
    const 目标玩家名称 = 目标玩家参数?.trim();
    if (!目标玩家名称) {
        return "请指定目标玩家名称";
    }

    const { username, 地区编号, 展示地区名称, 地区资料, 地区战略资料 } =
        await 地区司令设置检查(ctx, session, 地区编号参数);

    const 原司令 = (地区战略资料.地区司令 ?? "").trim();
    if (原司令 === 目标玩家名称) {
        return `${展示地区名称}（${地区编号}）已经是 ${目标玩家名称} 担任司令`;
    }

    await 更新地区战略资料(ctx, 地区编号, {
        地区司令: 目标玩家名称,
    });

    const 地区所属联军 = 地区资料.控制国家?.trim();
    if (地区所属联军) {
        await 尝试发送联军信号塔通报(ctx, {
            联军编号: 地区所属联军,
            通报标题: "地区军事变更",
            通报内容: `${username} 在 ${展示地区名称}（${地区编号}）任免地区司令为 ${目标玩家名称}`,
        });
    }

    // 发送地区信号塔通报（全局播报）
    await 尝试发送地区信号塔通报(ctx, {
        类型: "permission",
        操作类型: "设置司令",
        玩家名称: 目标玩家名称,
        地区名称: 展示地区名称,
        地区编号,
        操作者: username,
    });

    return `
====[征战文游]====
${username} 同志！
地区司令已更新
■ 地区：${展示地区名称}（${地区编号}）
■ 原司令：${原司令 || "暂无"}
■ 新司令：${目标玩家名称}
`.trim();
}

export function 设置司令(ctx: Context) {
    ctx.command("设置司令 <目标玩家:string> [地区编号:string]")
        .alias("任命司令")
        .alias("地区司令")
        .action(async ({ session }, 目标玩家参数, 地区编号参数) => {
            try {
                return await 执行设置司令(
                    ctx,
                    session,
                    目标玩家参数,
                    地区编号参数,
                );
            } catch (error) {
                return (error as Error).message;
            }
        });
}
