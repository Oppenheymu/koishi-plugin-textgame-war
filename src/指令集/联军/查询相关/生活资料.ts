import type { Context } from "koishi";
import { 玩家检查, 目标解析 } from "#/utils";

const 格式化 = (n: number) => n.toLocaleString("zh-CN");

export function 联军生活资料查询(ctx: Context) {
    ctx.command("查看联军生活资料 [目标:string]")
        .alias("联军生活资料")
        .alias("查看生活资料")
        .action(async ({ session }, 目标) => {
            try {
                const 输入目标 = 目标?.trim();

                let 查询用户名: string;
                let 联军编号: string | null;

                if (输入目标) {
                    const { 目标用户名, 目标用户资料 } = await 目标解析(
                        ctx,
                        session,
                        输入目标,
                    );
                    查询用户名 = 目标用户名;
                    联军编号 = 目标用户资料.所在联军;
                } else {
                    const { username, 用户资料 } = await 玩家检查(ctx, session);
                    查询用户名 = username;
                    联军编号 = 用户资料.所在联军;
                }

                if (!联军编号) {
                    throw new Error(`${查询用户名} 同志目前不在任何联军中`);
                }

                const [联军资料] = await ctx.database.get("马列联军表", {
                    联军编号,
                });
                if (!联军资料) {
                    throw new Error(
                        "数据异常：已记录所在联军但未找到联军档案，请联系管理员",
                    );
                }

                return `
====[征战文游]====
${查询用户名} 同志！
联军资本储备如下：
联军编号：${联军资料.联军编号}
生活资料：${格式化(联军资料.联军生活资料 ?? 0)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
