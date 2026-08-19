import type { Context } from "koishi";
import { 格式化, 目标联军解析  } from "#/utils";

export function 他的联军(ctx: Context) {
    ctx.command("他的联军 <目标:string>")
        .alias("查看他的联军")
        .alias("他的国家")
        .action(async ({ session }, 目标) => {
            try {
                const { 目标用户名, 联军资料, 展示联军名称 } = await 目标联军解析(
                    ctx,
                    session,
                    目标,
                );

                return `
====[征战文游]====
${目标用户名} 同志的联军信息：
■ 联军名称：${展示联军名称}
■ 联军编号：${联军资料.联军编号}
■ 联军成员：${格式化(联军资料.联军成员数量)}
■ 联军首都：${联军资料.联军首都}
今日GDP：${格式化(联军资料.当天内资本增量)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
