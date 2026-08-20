import type { Context } from "koishi";
import { 玩家联军权限设置, 玩家联军检查 } from "#ctx/coalition";
import { 带横幅回复, 指令错误转文本 } from "#shared/i18n";

const 文案 = {
    reply: `{user} 同志：
联军地区列表:
    - {regions}`,
};

export function 地区列表(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.coalition.regions", 文案);

    ctx.command("地区列表")
        .alias("联军地区列表")
        .alias("国家地区列表")
        .alias("联军地区")
        .alias("国家地区")
        .action(async ({ session }) => {
            try {
                const 权限等级需求 = await 玩家联军权限设置(ctx, session, "地区列表");
                const { username, 联军资料 } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 权限等级需求,
                    是否必须在成员列表: true,
                });

                return 带横幅回复(session, "textwar.coalition.regions.reply", {
                    user: username,
                    regions: 联军资料.联军地区列表.join("\n    - "),
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
