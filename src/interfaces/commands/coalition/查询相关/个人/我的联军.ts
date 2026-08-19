import type { Context } from "koishi";
import { 获取联军展示名称 } from "#ctx/coalition/domain/名称";
import { 玩家联军检查 } from "#ctx/coalition/domain/守卫";
import { 格式化 } from "#shared/format";

export function 我的联军(ctx: Context) {
    ctx.command("我的联军")
        .alias("查看我的联军")
        .action(async ({ session }) => {
            try {
                const { username, 联军资料 } = await 玩家联军检查(ctx, session);
                const 展示联军名称 = 获取联军展示名称(联军资料);

                return `
====[征战文游]====
${username} 同志！
你的联军信息如下：
■ 名称：${展示联军名称}
■ 编号：${联军资料.联军编号}
■ 政体：${联军资料.联军政治体制}
■ 成员：${格式化(联军资料.联军成员数量)} 个
■ 首都：${联军资料.联军首都}
今日GDP：${格式化(联军资料.当天内资本增量)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
