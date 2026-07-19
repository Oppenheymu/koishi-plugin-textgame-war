import type { Context } from "koishi";
import { TRandom } from "#/infrastructure";
import { 玩家检查 } from "#/utils";

export function 开采石油(ctx: Context) {
    ctx.command("开采石油")
        .alias("生产石油")
        .action(async ({ session }) => {
            try {
                const { id, username, 用户资料 } = await 玩家检查(ctx, session);

                // 格式化数字显示
                const 格式化 = (n: number) => n.toLocaleString("zh-CN");

                if (用户资料.生产次数 <= 0) {
                    return "生产次数不足";
                }

                if (用户资料.工人 < 400) {
                    return "工人不足，无法开采石油，需要至少400工人";
                }

                if (用户资料.生活资料 < 2000) {
                    return "生活资料不足，无法开采石油，需要至少2000生活资料";
                }

                const 增加的石油 = TRandom(6, 13, 40);
                const 原本的石油 = 用户资料.石油;
                const 增加后的石油 = 用户资料.石油 + 增加的石油;

                await ctx.database.set(
                    "马列玩家表",
                    {
                        id: id,
                    },
                    {
                        石油: 增加后的石油,
                        生活资料: 用户资料.生活资料 - 2000,
                        生产次数: 用户资料.生产次数 - 1,
                    },
                );
                return `
====[征战文游]====
${username} 同志：
■ 石油：${格式化(原本的石油)} → ${格式化(增加后的石油)}
■ 发出工资：2000
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
