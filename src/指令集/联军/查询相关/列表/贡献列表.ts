import type { Context } from "koishi";
import { 玩家联军权限设置 } from "#/logic";
import { 玩家联军检查, 获取联军贡献排行数据 } from "#/utils";

const 格式化 = (n: number) => n.toLocaleString("zh-CN");

export function 贡献排行(ctx: Context) {
    ctx.command("贡献排行")
        .alias("联军贡献排行")
        .alias("国家贡献排行")
        .action(async ({ session }) => {
            try {
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
                    : "    暂无贡献数据";

                return `
====[征战文游]====
${username} 同志：
联军贡献排行：
${排行文本}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
