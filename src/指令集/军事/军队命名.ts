import type { Context } from "koishi";
import { 军队命名工作流 } from "#/logic";
import { 军队解析, 玩家联军检查 } from "#/utils";

export function 军队命名(ctx: Context) {
    ctx.command("军队命名 <编号:number> <名称:text>")
        .alias("命名军队")
        .action(async ({ session }, 编号, 名称) => {
            try {
                const 结果 = await 玩家联军检查(ctx, session);
                const 军队 = await 军队解析(ctx, 编号);

                const { 工单编号, 完整名称 } = await 军队命名工作流(
                    ctx,
                    结果.联军资料,
                    军队,
                    结果,
                    名称,
                );

                return [
                    "====[军队命名]====",
                    `命名申请已提交审核（工单 #${工单编号}）`,
                    `■ 军队：#${军队.id}（第${军队.番号}军）`,
                    `■ 新名称：${完整名称}`,
                    "■ 审核通过后生效",
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}
