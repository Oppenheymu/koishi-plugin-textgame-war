import {
    Context
} from "koishi";
import {
    玩家联军检查,
} from "@/utils";
import {
    移除联军成员,
    尝试发送联军信号塔通报,
} from "@/logic";



export function 退出联军(ctx: Context) {
    ctx.command("退出联军")
        .alias("退出国家")
        .alias("退军")
        .action(async ({
            session
        }) => {
            try {
                const {
                    id,
                    uid,
                    username,
                    联军资料,
                    联军编号
                } =
                await 玩家联军检查(ctx, session, {
                    是否必须在成员列表: true,
                });

                if (联军资料.联军元首 === uid) {
                    return "你是联军元首，无法直接退出联军，请先移交元首身份";
                }

                await 移除联军成员(ctx, {
                    联军编号,
                    联军资料,
                    目标UID: uid,
                    目标用户ID: id,
                });

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号,
                    通报标题: "联军人事通报",
                    通报内容: `${username} 已主动退出联军`,
                });

                return `
====[征战文游]====
${username} 同志！
你已成功退出联军：${联军资料.联军名称}
■ 联军编号：${联军编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
