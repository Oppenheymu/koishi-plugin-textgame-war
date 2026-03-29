import { Context } from "koishi";
import { 初始化服务记录 } from "../Services/每日重置签到";

export function 初始化服务表(ctx: Context) {
    ctx.command("初始化服务表", { authority: 3 }).action(async () => {
        try {
            const { created, 今天 } = await 初始化服务记录(ctx);

            if (created) {
                return `服务表初始化成功：已创建 service 记录，日期 ${今天}`;
            }

            const 全局状态机 = await ctx.database.get("马列服务表", {
                id: "service",
            });
            const 服务记录 = 全局状态机[0];

            if (!服务记录) {
                return "服务表初始化失败：未找到 service 记录";
            }

            const 修复字段: {
                上次重置签到日期?: string;
                上次全服统计日期?: string;
            } = {};

            if (!服务记录.上次重置签到日期) {
                修复字段.上次重置签到日期 = 今天;
            }

            if (!服务记录.上次全服统计日期) {
                修复字段.上次全服统计日期 = 今天;
            }

            if (Object.keys(修复字段).length > 0) {
                await ctx.database.set(
                    "马列服务表",
                    { id: "service" },
                    修复字段,
                );
                return `服务表已修复：${Object.keys(修复字段).join("、")}`;
            }

            return "服务表已是正常状态，无需初始化";
        } catch (error) {
            return (error as Error).message;
        }
    });
}
