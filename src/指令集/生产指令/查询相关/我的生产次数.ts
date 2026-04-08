
import { Context } from "koishi";
import { 玩家检查 } from "../../../utils/index";



export function 我的生产次数(ctx: Context) {
    ctx.command("我的生产次数").alias('生产次数')
        .action(async ({ session }) => {
        try {

            const { username, 用户资料 } = await 玩家检查(ctx, session);

            return `
【情报查询】
${username} 同志！
■ 地面工人：${用户资料.生产次数}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
