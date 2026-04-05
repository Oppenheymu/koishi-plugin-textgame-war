
import { Context } from "koishi";
import { 玩家检查 } from "../../../utils";



export function 招募工人(ctx: Context) {
    ctx.command("招募工人 <数量:number>").action(async ({ session }, 数量) => {
        try {
            const { id, username, 用户资料 } = await 玩家检查(ctx, session);
            const 全球数据 = (
                await ctx.database.get("马列全球数据表", { id: "service" })
            )[0]!;

            // 格式化数字显示
            const 格式化 = (n: number) => n.toLocaleString("zh-CN");

            if (!数量) {
                return `
====[征战文游]====
${username} 同志：
每天从全球劳力市场招募工人
价格为全球平均工资的6倍
■示例：招募工人 10`;
            }

            if (数量 <= 0 || !Number.isInteger(数量)) {
                return `请输入正确的数量`;
            }

            if (数量 > 用户资料.工人招募限额) {
                return `超出每日招募限额`;
            }

            if (数量 > 全球数据.全球劳动力市场) {
                return `可招募的工人不足`;
            }

            const 花费 = 数量 * 全球数据.全球平均工资 * 6;
            if (花费 > 用户资料.生活资料) {
                return `你的生活资料不足`;
            }

            const 新生活资料 = 用户资料.生活资料 - 花费;
            const 新工人数量 = 用户资料.工人 + 数量;
            const 新招募限额 = 用户资料.工人招募限额 - 数量;
            const 新全球劳动力市场 = 全球数据.全球劳动力市场 - 数量;

            await ctx.database.set(
                "马列玩家表",
                { id: id },
                {
                    生活资料: 新生活资料,
                    工人: 新工人数量,
                    工人招募限额: 新招募限额,
                },
            );
            await ctx.database.set(
                "马列全球数据表",
                { id: "service" },
                { 全球劳动力市场: 新全球劳动力市场 },
            );

            return `
====[征战文游]====
${username} 同志：
成功招募工人
■ 工人数量：${格式化(用户资料.工人)} → ${格式化(新工人数量)}
■ 每日限额：${格式化(用户资料.工人招募限额)} → ${格式化(新招募限额)}
■ 生活资料：
${格式化(用户资料.生活资料)} → ${格式化(新生活资料)}`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
