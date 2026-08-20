import type { Context } from "koishi";
import { 尝试发送联军信号塔通报 } from "#ctx/beacon";
import {
    政变后权限重置,
    玩家联军检查,
    联军政体,
    获取成员联军贡献,
    获取排除成员后前N贡献总和,
    获取政体默认权限配置,
    设置联军权限配置,
} from "#ctx/coalition";
import { 同步元首政体军衔 } from "#ctx/military";

const 格式化 = (n: number) =>
    n.toLocaleString("zh-CN", {
        maximumFractionDigits: 2,
    });

export function 政变(ctx: Context) {
    ctx.command("政变")
        .alias("发动政变")
        .action(async ({ session }) => {
            try {
                const { uid, username, 联军资料, 联军编号 } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 1,
                    是否必须在成员列表: true,
                });

                const 我的贡献 = 获取成员联军贡献(联军资料, uid);
                const 前六总贡献 = 获取排除成员后前N贡献总和(联军资料, uid, 6);

                if (我的贡献 <= 前六总贡献) {
                    return `政变失败：你的贡献（${格式化(
                        我的贡献,
                    )}）必须大于前六成员总贡献（${格式化(前六总贡献)}）`;
                }

                const 权限列表更新 = 政变后权限重置(联军资料, uid);

                await Promise.all([
                    ctx.database.set(
                        "征战联军表",
                        {
                            联军编号,
                        },
                        {
                            联军政治体制: 联军政体.极权制,
                            联军元首: uid,
                            联军总理: uid,
                            ...权限列表更新,
                        },
                    ),
                    设置联军权限配置(ctx, 联军编号, 获取政体默认权限配置(联军政体.极权制)),
                ]);

                // 政体联动：新元首按极权制获得自动军衔（少将），旧元首政体自动军衔移除
                await 同步元首政体军衔(ctx, 联军编号);

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号,
                    通报标题: "联军政变通报",
                    通报内容: `${username} 发动政变！！！他已成为新任联军元首与总理`,
                });

                return `
====[征战文游]====
${username} 同志！
政变成功，你已成为新的联军元首与总理
■ 联军编号：${联军编号}
■ 当前政体：${联军政体.极权制}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
