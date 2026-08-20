import type { Context } from "koishi";
import { 玩家联军权限设置, 玩家联军检查, 获取联军贡献排行数据 } from "#ctx/coalition";
import { 格式化 } from "#shared/format";
import { 带横幅回复, 指令错误转文本 } from "#shared/i18n";
import { 会话检查 } from "#shared/session";

const 文案 = {
    reply: `{user} 同志：
联军贡献排行：
{list}`,
    empty: "    暂无贡献数据",
};

export function 贡献排行(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.coalition.contributions", 文案);

    ctx.command("贡献排行")
        .alias("联军贡献排行")
        .alias("国家贡献排行")
        .action(async ({ session }) => {
            try {
                会话检查(session);
                const 权限等级需求 = await 玩家联军权限设置(ctx, session, "贡献排行");
                const { username, 联军资料 } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 权限等级需求,
                    是否必须在成员列表: true,
                });

                const 排行列表 = 获取联军贡献排行数据(联军资料)
                    .slice(0, 15)
                    .map((成员) => ({
                        成员ID: 成员.成员UID,
                        联军贡献: 成员.联军贡献,
                    }));

                const 排行文本 = 排行列表.length
                    ? 排行列表
                          .map(
                              (成员, 索引) =>
                                  `  ${索引 + 1}.  ${成员.成员ID} - ${格式化(成员.联军贡献)}`,
                          )
                          .join("\n")
                    : session.text("textwar.coalition.contributions.empty");

                return 带横幅回复(session, "textwar.coalition.contributions.reply", {
                    user: username,
                    list: 排行文本,
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
