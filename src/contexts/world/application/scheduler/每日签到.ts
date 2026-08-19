import type { Context } from "koishi";
import type { 每日签到重置结果 } from "#ctx/world/application/scheduler/types";

import { 初始化服务记录 } from "#ctx/world/application/scheduler/记录载入";

import { 服务事件中心 } from "#shared/events";

let 正在执行每日重置 = false;

export async function 执行每日签到重置(ctx: Context): Promise<每日签到重置结果> {
    if (正在执行每日重置) {
        return {
            是否执行: false,
            今天: "",
            重置玩家数量: 0,
            原因: "每日签到重置正在执行中",
        };
    }

    正在执行每日重置 = true;

    try {
        const { created, 今天 } = await 初始化服务记录(ctx);
        const [服务记录] = await ctx.database.get("马列服务表", {
            id: "service",
        });

        if (!服务记录) {
            return {
                是否执行: false,
                今天,
                重置玩家数量: 0,
                原因: "服务记录缺失",
            };
        }

        const 上次重置时间 = 服务记录.上次重置签到日期;
        const 需要执行 = created || !上次重置时间 || 今天 > 上次重置时间;

        if (!需要执行) {
            return {
                是否执行: false,
                今天,
                重置玩家数量: 0,
                原因: `今日已重置（上次重置日期：${上次重置时间}）`,
            };
        }

        if (!created) {
            await ctx.database.set("马列服务表", { id: "service" }, { 上次重置签到日期: 今天 });
        }

        const 玩家列表 = await ctx.database.get("马列玩家表", {});
        await Promise.all([
            ctx.database.set("马列玩家表", {}, { 今日是否签到: false, 工人招募限额: 1000 }),
            ctx.database.set("马列联军表", {}, { 当天扩军累计: 0 }),
        ]);

        服务事件中心.emit("重置与调度:每日签到重置完成", {
            日期: 今天,
            重置玩家数量: 玩家列表.length,
        });

        return {
            是否执行: true,
            今天,
            重置玩家数量: 玩家列表.length,
        };
    } finally {
        正在执行每日重置 = false;
    }
}
