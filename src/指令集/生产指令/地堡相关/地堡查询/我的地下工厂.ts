import {
    Context
} from "koishi";
import {
    玩家检查
} from "../../../../utils/";

export function 我的地下工厂(ctx: Context) {
    ctx.command("我的地下工厂").action(async ({
        session
    }) => {
        try {
            const {
                username,
                用户资料
            } = await 玩家检查(ctx, session);

            // 格式化数字显示
            const 格式化 = (n: number) => n.toLocaleString("zh-CN");

            return `
====[地下工厂]====
${username} 同志：
■ 地下工人：${格式化(用户资料.地下工人)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}