import type { Context } from "koishi";
import { 玩家联军检查, 联军权限动作列表, 获取联军权限配置 } from "#ctx/coalition";
import { 带横幅回复, 指令错误转文本 } from "#shared/i18n";

const 文案 = {
    reply: `{user} 同志：
■ 你的联军权限：{level}级
■ 联军编号：{id}
联军操作权限需求：
{detail}`,
};

export function 我的联军权限(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.coalition.my-permissions", 文案);

    ctx.command("我的联军权限")
        .alias("我的权限")
        .action(async ({ session }) => {
            try {
                const { username, 联军编号, 权限等级 } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 1,
                    是否必须在成员列表: true,
                });

                const 联军权限配置 = await 获取联军权限配置(ctx, 联军编号);
                const 权限详情 = 联军权限动作列表
                    .map((动作) => `□ ${动作}: ${联军权限配置[动作]}级`)
                    .join("\n");

                return 带横幅回复(session, "textwar.coalition.my-permissions.reply", {
                    user: username,
                    level: 权限等级,
                    id: 联军编号,
                    detail: 权限详情,
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
