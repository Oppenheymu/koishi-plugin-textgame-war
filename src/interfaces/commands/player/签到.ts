import type { Context } from "koishi";
import { TRandom } from "#/infrastructure";
import { 玩家检查 } from "#ctx/player";
import { 格式化 } from "#shared/format";

export function 签到(ctx: Context) {
    ctx.command("签到")
        .alias("阅读报告")
        .action(async ({ session }) => {
            const { id, username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示

            try {
                if (用户资料.今日是否签到 === true) {
                    return `
====[征战文游]====
${username} 同志！
您今天已签到过了！
`.trim();
                } else {
                    const 增加的工人 = TRandom(50, 100, 200);
                    const 增加的石油 = TRandom(50, 150, 250);
                    const 增加的钢铁 = TRandom(50, 100, 300);
                    const 增加的生活资料 = TRandom(10000, 20000, 50000);
                    const 增加后的工人 = 用户资料.工人 + 增加的工人;
                    const 增加后的石油 = 用户资料.石油 + 增加的石油;
                    const 增加后的钢铁 = 用户资料.钢铁 + 增加的钢铁;
                    const 增加后的生活资料 = 用户资料.生活资料 + 增加的生活资料;

                    await ctx.database.set(
                        "马列玩家表",
                        {
                            id: id,
                        },
                        {
                            今日是否签到: true,
                            工人: 增加后的工人,
                            石油: 增加后的石油,
                            钢铁: 增加后的钢铁,
                            生活资料: 增加后的生活资料,
                        },
                    );

                    if (用户资料.厂房 < 10000) {
                        await ctx.database.set(
                            "马列玩家表",
                            {
                                id: id,
                            },
                            {
                                厂房: 10000,
                            },
                        );
                    }

                    return `
===[征战文游]===
${username} 同志！
今日报告，获得物资：
■ 工人：+${格式化(增加的工人)}
■ 石油：+${格式化(增加的石油)}
■ 钢铁：+${格式化(增加的钢铁)}
■ 生活资料：+${格式化(增加的生活资料)}
□ 厂房已重置（如果不足）
`.trim();
                }
            } catch (error) {
                return (error as Error).message;
            }
        });
}
