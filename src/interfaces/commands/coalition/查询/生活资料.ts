import type { Context } from "koishi";
import { 目标解析 } from "#/interfaces/commands/common/target";
import { 玩家检查 } from "#ctx/player";
import { 格式化 } from "#shared/format";
import { 带横幅回复, 指令错误转文本, 文案错误 } from "#shared/i18n";

const 文案 = {
    reply: `{user} 同志！
联军资本储备如下：
联军编号：{id}
生活资料：{supplies}`,
};

export function 联军生活资料查询(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.coalition.supplies", 文案);

    ctx.command("查看联军生活资料 [目标:string]")
        .alias("联军生活资料")
        .alias("查看生活资料")
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

                const [联军资料] = await ctx.database.get("征战联军表", {
                    联军编号,
                });
                if (!联军资料) {
                    throw new 文案错误("textwar.coalition.data-missing");
                }

                return 带横幅回复(session, "textwar.coalition.supplies.reply", {
                    user: 查询用户名,
                    id: 联军资料.联军编号,
                    supplies: 格式化(联军资料.联军生活资料 ?? 0),
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
