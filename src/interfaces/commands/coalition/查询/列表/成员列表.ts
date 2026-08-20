import type { Context } from "koishi";
import { 玩家联军权限设置, 玩家联军检查 } from "#ctx/coalition";
import { 带横幅回复, 指令错误转文本 } from "#shared/i18n";
import { 会话检查 } from "#shared/session";

const 文案 = {
    reply: `{user} 同志：
联军成员列表:
{list}`,
    empty: "    -暂无成员",
};

export function 成员列表(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.coalition.members", 文案);

    ctx.command("成员列表")
        .alias("联军成员列表")
        .alias("国家成员列表")
        .alias("联军成员")
        .alias("国家成员")
        .action(async ({ session }) => {
            try {
                会话检查(session);
                const 权限等级需求 = await 玩家联军权限设置(ctx, session, "成员列表");
                const { username, 联军资料 } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 权限等级需求,
                    是否必须在成员列表: true,
                });

                const 成员列表 = Object.keys(联军资料.联军成员列表 ?? {});
                const 成员文本 = 成员列表.length
                    ? 成员列表.map((成员) => `    - ${成员}`).join("\n")
                    : session.text("textwar.coalition.members.empty");

                return 带横幅回复(session, "textwar.coalition.members.reply", {
                    user: username,
                    list: 成员文本,
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
