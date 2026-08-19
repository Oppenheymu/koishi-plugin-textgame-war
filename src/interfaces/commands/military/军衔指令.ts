import type { Context } from "koishi";
import { 玩家联军检查, 获取联军操作权限 } from "#ctx/coalition";
import {
    任命指挥官工作流,
    军衔,
    军衔名称映射,
    军衔权益表,
    军队解析,
    授衔工作流,
    获取玩家军队列表,
    获取联军军衔记录,
    褫夺军衔工作流,
    解析军衔名称,
} from "#ctx/military";
import { 目标解析 } from "#shared/target";

export function 授衔(ctx: Context) {
    ctx.command("授衔 <目标:string> <军衔名:string>")
        .alias("授予军衔")
        .action(async ({ session }, 目标, 军衔名) => {
            try {
                const 结果 = await 玩家联军检查(ctx, session);
                const 目标玩家 = await 目标解析(ctx, session, 目标);

                const 目标军衔 = 解析军衔名称(军衔名 ?? "");
                if (!目标军衔) {
                    return `无效军衔，可选：${Object.values(军衔名称映射).join(" / ")}`;
                }

                const { 途径 } = await 授衔工作流(
                    ctx,
                    结果.联军资料,
                    结果,
                    目标玩家.目标用户资料.uid,
                    目标玩家.目标用户名,
                    目标军衔,
                );

                return [
                    "====[授衔]====",
                    `${目标玩家.目标用户名} 被授予【${军衔名称映射[目标军衔]}】军衔`,
                    `■ 途径：${途径 === "政治授予" ? "政治任命" : "军事任免"}`,
                    `■ 授予者：${结果.username}`,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}

export function 褫夺军衔(ctx: Context) {
    ctx.command("褫夺军衔 <目标:string>")
        .alias("剥夺军衔")
        .action(async ({ session }, 目标) => {
            try {
                const 结果 = await 玩家联军检查(ctx, session);
                const 目标玩家 = await 目标解析(ctx, session, 目标);

                const { 无主军队数 } = await 褫夺军衔工作流(
                    ctx,
                    结果.联军资料,
                    结果,
                    目标玩家.目标用户资料.uid,
                    目标玩家.目标用户名,
                );

                return [
                    "====[褫夺军衔]====",
                    `${目标玩家.目标用户名} 的军衔已被褫夺`,
                    无主军队数 > 0
                        ? `■ 其指挥的 ${无主军队数} 支军队已转为无主状态，可通过【任命指挥官】重新指派`
                        : "■ 其名下没有军队",
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}

export function 我的军衔(ctx: Context) {
    ctx.command("我的军衔").action(async ({ session }) => {
        try {
            const 结果 = await 玩家联军检查(ctx, session);
            const 记录 = await 获取联军军衔记录(ctx, 结果.联军编号, 结果.uid);

            if (!记录) {
                return [
                    "====[我的军衔]====",
                    `${结果.username} 同志，你目前没有军衔`,
                    "■ 无军衔无法组建军队，请等待联军授衔",
                ].join("\n");
            }

            const 权益 = 军衔权益表[记录.军衔];
            const 已有军队 = await 获取玩家军队列表(ctx, 结果.联军编号, 结果.uid);
            const 格式化上限 = (n: number) => (n === Infinity ? "不限" : n.toLocaleString("zh-CN"));

            return [
                "====[我的军衔]====",
                `${结果.username} 同志：【${军衔名称映射[记录.军衔]}】`,
                `■ 来源：${记录.来源}`,
                `■ 可建军数量：${已有军队.length} / ${格式化上限(权益.可建军数量)}`,
                `■ 单军兵力上限：${格式化上限(权益.单军兵力上限)}`,
                记录.军衔 >= 军衔.少将 ? "■ 将官特权：可指挥本国任何军队、可任免尉官" : "",
            ]
                .filter(Boolean)
                .join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });
}

export function 任命指挥官(ctx: Context) {
    ctx.command("任命指挥官 <编号:number> <目标:string>").action(
        async ({ session }, 编号, 目标) => {
            try {
                const 结果 = await 玩家联军检查(ctx, session);

                // 政治权限校验
                const 所需等级 = await 获取联军操作权限(ctx, 结果.联军编号, "任命指挥官");
                if (结果.权限等级 < 所需等级) {
                    return `权限不足：任命指挥官需要联军 ${所需等级} 级及以上权限`;
                }

                const 军队 = await 军队解析(ctx, 编号);
                if (军队.所属联军编号 !== 结果.联军编号) {
                    return "只能任命本联军的军队";
                }

                const 目标玩家 = await 目标解析(ctx, session, 目标);
                await 任命指挥官工作流(ctx, 军队, 目标玩家.目标用户资料.uid, 目标玩家.目标用户名);

                return [
                    "====[任命指挥官]====",
                    `${目标玩家.目标用户名} 已接任军队 #${军队.id}（${军队.名称}）指挥官`,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        },
    );
}
