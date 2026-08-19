import type { Context } from "koishi";
import { 格式化, 目标解析  } from "#/utils";

export function 他的全部资料(ctx: Context) {
    ctx.command("他的全部资料 <目标>", {
        authority: 3,
    }).action(async ({ session }, 目标) => {
        try {
            const { 目标用户名, 目标用户资料 } = await 目标解析(ctx, session, 目标);

            return `
${目标用户名} 的全部资料:
■ 生活资料：${格式化(目标用户资料.生活资料)}
■ 科技/生产技术：${目标用户资料.科技等级}/${目标用户资料.生产技术}
■ 工人/地下/休假：${格式化(目标用户资料.工人)}/${格式化(
                目标用户资料.地下工人,
            )}/${格式化(目标用户资料.休假工人)}
■ 石油：${格式化(目标用户资料.石油)}
■ 钢铁：${格式化(目标用户资料.钢铁)}
`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
