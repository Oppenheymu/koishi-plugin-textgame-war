import type { Context } from "koishi";
import type { PlayerWarData } from "../../../../types";
import { 玩家检查 } from "../../../../utils";

export function 我的弹药(ctx: Context) {
    ctx.command("我的弹药").action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);
            const 格式化 = (n: number) => n.toLocaleString("zh-CN");

            const 战争数据 = 用户资料 as unknown as PlayerWarData;

            return `
====[我的弹药]====
${username} 同志：
■ 火箭弹：${格式化(战争数据.火箭弹)}
■ 防空弹药：${格式化(战争数据.防空弹药)}
■ 轻型航弹：${格式化(战争数据.轻型航弹)}
■ 重型航弹：${格式化(战争数据.重型航弹)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
