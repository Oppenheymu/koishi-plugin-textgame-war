import { Context, Session } from "koishi";
import { 玩家检查 } from "../../../Utils/用户检查";

export function 我的UID(ctx: Context) {
    ctx.command("我的UID")
        .alias("我的唯一标识符")
        .alias("UID")
        .action(async ({ session }) => {
            try {
                const { uid } = await 玩家检查(ctx, session);
                return `你的UID是：${uid}`;
            } catch (error) {
                return (error as Error).message;
            }
        });
}
