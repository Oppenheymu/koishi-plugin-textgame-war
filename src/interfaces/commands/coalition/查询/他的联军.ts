import type { Context } from "koishi";
import { 目标联军解析 } from "#/interfaces/commands/common/target";
import { 格式化 } from "#shared/format";
import { 带横幅回复, 指令错误转文本 } from "#shared/i18n";

const 文案 = {
    reply: `{user} 同志的联军信息：
■ 联军名称：{name}
■ 联军编号：{id}
■ 联军成员：{members}
■ 联军首都：{capital}
今日GDP：{gdp}`,
};

export function 他的联军(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.coalition.info", 文案);

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

                return 带横幅回复(session, "textwar.coalition.info.reply", {
                    user: 目标用户名,
                    name: 展示联军名称,
                    id: 联军资料.联军编号,
                    members: 格式化(联军资料.联军成员数量),
                    capital: 联军资料.联军首都,
                    gdp: 格式化(联军资料.当天内资本增量),
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
