import { Context, Session } from "koishi";
import { 玩家检查 } from "../../Utils/会话与用户检查";



export async function 我的UID(ctx: Context) {
    ctx.command('我的UID', '查看你的UID，UID是你在游戏中的唯一标识符')
        .action(async ({ session }) => {
            try {
                const { uid } = await 玩家检查(ctx, session);
                return `你的UID是：${uid}`;
            } catch (error) {
                return (error as Error).message;
            }
        });
}
