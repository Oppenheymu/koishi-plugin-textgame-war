import type { Context } from "koishi";
import { 目标解析 } from "../utils";

export function 设置资源(ctx: Context) {
    ctx.command("设置资源 <目标> <资源类型> <数量>", {
        authority: 3,
    }).action(async ({ session }, 目标, 资源类型, 数量) => {
        try {
            const { 目标用户ID } = await 目标解析(ctx, session, 目标);
            const 格式化 = (n: number) => n.toLocaleString("zh-CN");

            // 类型转换：支持 true/false/1/0/字符串
            let value: number | boolean;
            if (数量 === "true") {
                value = true;
            } else if (数量 === "false") {
                value = false;
            } else if (!Number.isNaN(Number(数量))) {
                value = Number(数量);
            } else {
                return "数量参数格式错误，只能为数字或布尔值";
            }

            await ctx.database.set(
                "马列玩家表",
                {
                    id: 目标用户ID,
                },
                {
                    [资源类型]: value,
                },
            );

            if (typeof value === "number")
                return `成功将 ${目标} 的 ${资源类型} 设置为 ${格式化(value)}`;
            if (typeof value === "boolean")
                return `成功将 ${目标} 的 ${资源类型} 设置为 ${value}`;
        } catch (error) {
            return (error as Error).message;
        }
    });
}
