import type { Context } from "koishi";
import { 格式化 } from "#shared/format";
import { 带横幅回复, 指令错误转文本 } from "#shared/i18n";
import { 会话检查, 用户检查 } from "#shared/session";

import { 创建新玩家档案, 清理已有玩家档案, 选定语言 } from "./注册写入.js";

const 文案 = {
    "already-registered": "同志，你已经注册过了（UID: {uid}）",
    reply: `{user} 同志 注册成功
□ 新玩家注册奖励:
■ 工人：{workers}
■ 钢铁：{steel}
■ 石油：{oil}
■ 生活资料：{supplies}

发送[帮助]查看指令表
发送[词典]查看设定`,
};

// 注册引导语：此时玩家语言未知，只能双语并列
const 未选择语言 =
    "注册已取消（未选择语言），重新发送[注册]即可 / Registration cancelled, resend [注册] to retry";

export function 注册(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar.register", 文案);

    ctx.command("注册")
        .alias("首次阅读报告")
        .action(async ({ session }) => {
            try {
                会话检查(session);
                用户检查(session);

                const platform = session.platform!;
                const userId = session.userId!;

                const 已注册 = await 清理已有玩家档案(ctx, platform, userId);
                if (已注册) {
                    const [配置] = await ctx.database.get("征战玩家配置表", {
                        [platform]: userId,
                    });
                    return session.text("textwar.register.already-registered", {
                        uid: 配置?.uid ?? "",
                    });
                }

                if (!(await 选定语言(session))) {
                    return 未选择语言;
                }

                const { username, 初始资源 } = await 创建新玩家档案(
                    ctx,
                    session,
                    platform,
                    userId,
                );

                return 带横幅回复(session, "textwar.register.reply", {
                    user: username,
                    workers: 格式化(初始资源.工人),
                    steel: 格式化(初始资源.钢铁),
                    oil: 格式化(初始资源.石油),
                    supplies: 格式化(初始资源.生活资料),
                });
            } catch (error) {
                return 指令错误转文本(session, error);
            }
        });
}
