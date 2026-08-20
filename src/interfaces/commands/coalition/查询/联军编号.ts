import type { Context } from "koishi";
import { 目标解析 } from "#/interfaces/commands/common/target";
import { 玩家检查 } from "#ctx/player";
import { 带横幅回复, 指令错误转文本, 文案错误 } from "#shared/i18n";

const 文案 = {
    reply: `{user} 同志：
联军编号：{id}`,
};

export function 联军编号(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.coalition.number", 文案);

    ctx.command("联军编号 [目标:string]")
        .alias("联军ID")
        .alias("国家编号")
        .action(async ({ session }, 目标) => {
            try {
                const 输入目标 = 目标?.trim();

                let 查询用户名: string;
                let 联军编号: string | null;

                if (输入目标) {
                    const { 目标用户名, 目标用户资料 } = await 目标解析(ctx, session, 输入目标);
                    查询用户名 = 目标用户名;
                    联军编号 = 目标用户资料.所在联军;
                } else {
                    const { username, 用户资料 } = await 玩家检查(ctx, session);
                    查询用户名 = username;
                    联军编号 = 用户资料.所在联军;
                }

                if (!联军编号) {
                    throw new 文案错误("textwar.coalition.not-in-coalition", {
                        user: 查询用户名,
                    });
                }

                return 带横幅回复(session, "textwar.coalition.number.reply", {
                    user: 查询用户名,
                    id: 联军编号,
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
