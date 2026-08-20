import type { Context } from "koishi";
import { 玩家联军检查, 获取联军展示名称 } from "#ctx/coalition";
import { 格式化 } from "#shared/format";
import { 带横幅回复, 指令错误转文本 } from "#shared/i18n";

const 文案 = {
    reply: `{user} 同志！
你的联军信息如下：
■ 名称：{name}
■ 编号：{id}
■ 政体：{polity}
■ 成员：{members} 个
■ 首都：{capital}
今日GDP：{gdp}`,
};

export function 我的联军(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.coalition.mine", 文案);

    ctx.command("我的联军")
        .alias("查看我的联军")
        .action(async ({ session }) => {
            try {
                const { username, 联军资料 } = await 玩家联军检查(ctx, session);
                const 展示联军名称 = 获取联军展示名称(联军资料);

                return 带横幅回复(session, "textwar.coalition.mine.reply", {
                    user: username,
                    name: 展示联军名称,
                    id: 联军资料.联军编号,
                    polity: 联军资料.联军政治体制,
                    members: 格式化(联军资料.联军成员数量),
                    capital: 联军资料.联军首都,
                    gdp: 格式化(联军资料.当天内资本增量),
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
