import type { Context } from "koishi";
import { 玩家检查 } from "../../../utils/index";

export function 我的工人(ctx: Context) {
    ctx.command("我的工人").action(async ({ session }) => {
        try {
            const { username, 用户资料 } = await 玩家检查(ctx, session);

            // 格式化数字显示
            const 格式化 = (n: number) => n.toLocaleString("zh-CN");

            return `
【情报查询】
==公开情报==
${username}
■ 地面工人：${格式化(用户资料.工人)}
■ 休假工人：${格式化(用户资料.休假工人)}
■ 劳动报酬：${用户资料.工人工资}
■ 生产技术：${用户资料.生产技术}
■ 生产力：${格式化(用户资料.工人 * 用户资料.生产技术)}
■ 厂房容量：${格式化(用户资料.厂房)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
