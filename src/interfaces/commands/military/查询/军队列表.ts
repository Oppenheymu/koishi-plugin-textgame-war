// 军队列表指令
import type { Context } from "koishi";
import { 玩家联军检查, 获取联军展示名称, 获取联军操作权限 } from "#ctx/coalition";
import { 格式化, 获取用户名缓存 } from "./共用.js";

export function 军队列表(ctx: Context) {
    ctx.command("军队列表 [联军编号:string]").action(async ({ session }, 联军编号) => {
        try {
            const 结果 = await 玩家联军检查(ctx, session);
            const 目标联军编号 = 联军编号?.trim() || 结果.联军编号;

            if (目标联军编号 !== 结果.联军编号) {
                const 所需等级 = await 获取联军操作权限(ctx, 结果.联军编号, "查看地区军事");
                if (结果.权限等级 < 所需等级) {
                    return `查看他国军队列表需要本联军 ${所需等级} 级及以上权限`;
                }
            }

            const [联军资料] = await ctx.database.get("马列联军表", {
                联军编号: 目标联军编号,
            });
            if (!联军资料) {
                return `未找到联军：${目标联军编号}`;
            }

            const 军队列表 = await ctx.database.get("马列军队表", {
                所属联军编号: 目标联军编号,
            });
            if (军队列表.length === 0) {
                return `${获取联军展示名称(联军资料)} 当前没有军队`;
            }

            const 用户名缓存 = await 获取用户名缓存(
                ctx,
                军队列表.map((a) => a.指挥官UID),
            );

            const 行 = 军队列表
                .sort((a, b) => a.番号 - b.番号)
                .map((军队) => {
                    const 指挥官 = 军队.指挥官UID
                        ? (用户名缓存.get(军队.指挥官UID) ?? "未知")
                        : "无主";
                    return `■ #${军队.id} 第${军队.番号}军【${军队.状态}】${军队.名称} | 指挥官：${指挥官} | 兵力 ${格式化(军队.士兵数量)}`;
                });

            return [`====[${获取联军展示名称(联军资料)} 军队列表]====`, ...行].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });
}
