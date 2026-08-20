import type { Context } from "koishi";
import { 确保服务记录 } from "#/infrastructure";
import { 尝试发送后台信号塔日志, 尝试发送新闻信号塔通报 } from "#ctx/beacon";
import type { 全服统计执行结果 } from "#ctx/world/application/stats/types";

import { 构建全服统计新闻内容 } from "#ctx/world/application/stats/新闻构建";

import { 服务事件中心, 获取今天日期 } from "#shared/events";

let 正在执行全服统计 = false;

function 构造未执行结果(今天: string, 原因: string): 全服统计执行结果 {
    return {
        今天,
        是否执行: false,
        原因,
        玩家数量: 0,
        平均工资: 0,
        平均科技等级: 0,
        昨日全球生产总值: 0,
        新闻已发送数量: 0,
        新闻发送失败数量: 0,
    };
}

function 构造无新闻执行结果(输入: {
    今天: string;
    玩家数量: number;
    平均工资: number;
    平均科技等级: number;
}): 全服统计执行结果 {
    return {
        今天: 输入.今天,
        是否执行: true,
        玩家数量: 输入.玩家数量,
        平均工资: 输入.平均工资,
        平均科技等级: 输入.平均科技等级,
        昨日全球生产总值: 0,
        新闻已发送数量: 0,
        新闻发送失败数量: 0,
    };
}

async function 记录统计日期(ctx: Context, 今天: string): Promise<void> {
    await ctx.database.set("征战服务表", { id: "service" }, { 上次全服统计日期: 今天 });
}

async function 校验是否需要统计(
    ctx: Context,
    今天: string,
    options?: { 忽略日期检查?: boolean },
): Promise<string | null> {
    const [服务记录] = await ctx.database.get("征战服务表", {
        id: "service",
    });

    if (!服务记录) {
        await 确保服务记录(ctx, { 上次全服统计日期: 今天 });
        return null;
    }

    if (options?.忽略日期检查) {
        return null;
    }

    const 上次统计时间 = 服务记录.上次全服统计日期;
    if (上次统计时间 && 今天 <= 上次统计时间) {
        return `今日已统计（上次统计日期：${上次统计时间}）`;
    }

    return null;
}

function 计算玩家平均值(玩家列表: { 工人工资: number; 科技等级: number }[]): {
    平均工资: number;
    平均科技等级: number;
} {
    let 总工资 = 0;
    let 总科技 = 0;

    for (const 玩家 of 玩家列表) {
        总工资 += 玩家.工人工资;
        总科技 += 玩家.科技等级;
    }

    return {
        平均工资: Math.floor(总工资 / 玩家列表.length),
        平均科技等级: Math.floor(总科技 / 玩家列表.length),
    };
}

type 全局数据快照 =
    | { 已初始化: true; 昨日全球生产总值: number; 历史生产记录: number[] }
    | { 已初始化: false };

async function 读取或初始化全局数据(
    ctx: Context,
    平均工资: number,
    平均科技等级: number,
): Promise<全局数据快照> {
    const [全局数据] = await ctx.database.get("征战全球数据表", {
        id: "global",
    });

    if (!全局数据) {
        await ctx.database.create("征战全球数据表", {
            id: "global",
            全球平均工资: 平均工资,
            全球平均科技等级: 平均科技等级,
            历史生产记录: [],
            今日全球生产总值: 0,
            近三天全球生产总值: 0,
            近七天全球生产总值: 0,
        });
        return { 已初始化: false };
    }

    const 昨日全球生产总值 = 全局数据.今日全球生产总值 || 0;
    let 历史生产记录: number[] = [...(全局数据.历史生产记录 || []), 昨日全球生产总值];

    if (历史生产记录.length > 7) {
        历史生产记录 = 历史生产记录.slice(-7);
    }

    return { 已初始化: true, 昨日全球生产总值, 历史生产记录 };
}

async function 更新全局数据并通报(
    ctx: Context,
    统计输入: {
        今天: string;
        玩家数量: number;
        平均工资: number;
        平均科技等级: number;
        昨日全球生产总值: number;
        历史生产记录: number[];
    },
): Promise<全服统计执行结果> {
    const 近三天全球生产总值 = 统计输入.历史生产记录.slice(-3).reduce((a, b) => a + b, 0);
    const 近七天全球生产总值 = 统计输入.历史生产记录.slice(-7).reduce((a, b) => a + b, 0);

    await ctx.database.set(
        "征战全球数据表",
        { id: "global" },
        {
            全球平均工资: 统计输入.平均工资,
            全球平均科技等级: 统计输入.平均科技等级,
            历史生产记录: 统计输入.历史生产记录,
            近三天全球生产总值,
            近七天全球生产总值,
            今日全球生产总值: 0,
        },
    );

    const 新闻结果 = await 尝试发送新闻信号塔通报(ctx, {
        标题: "全服基础数据日报",
        内容: 构建全服统计新闻内容({
            今天: 统计输入.今天,
            玩家数量: 统计输入.玩家数量,
            平均工资: 统计输入.平均工资,
            平均科技等级: 统计输入.平均科技等级,
            昨日全球生产总值: 统计输入.昨日全球生产总值,
            近三天全球生产总值,
            近七天全球生产总值,
        }),
    });

    await ctx.database.set("征战服务表", { id: "service" }, { 上次全服统计日期: 统计输入.今天 });

    服务事件中心.emit("生产与统计:全服统计完成", {
        日期: 统计输入.今天,
        玩家数量: 统计输入.玩家数量,
        昨日全球生产总值: 统计输入.昨日全球生产总值,
    });

    ctx.logger("全服数据统计").info(
        `统计完成：平均工资=${统计输入.平均工资}，平均科技=${统计输入.平均科技等级}，昨日产值=${统计输入.昨日全球生产总值}`,
    );

    return {
        今天: 统计输入.今天,
        是否执行: true,
        玩家数量: 统计输入.玩家数量,
        平均工资: 统计输入.平均工资,
        平均科技等级: 统计输入.平均科技等级,
        昨日全球生产总值: 统计输入.昨日全球生产总值,
        新闻已发送数量: 新闻结果?.已发送.length ?? 0,
        新闻发送失败数量: 新闻结果?.发送失败.length ?? 0,
    };
}

export async function 执行每日全服统计(
    ctx: Context,
    options?: { 忽略日期检查?: boolean },
): Promise<全服统计执行结果> {
    if (正在执行全服统计) {
        return 构造未执行结果(获取今天日期(), "全服统计正在执行中");
    }

    正在执行全服统计 = true;

    try {
        const 今天 = 获取今天日期();
        const 未执行原因 = await 校验是否需要统计(ctx, 今天, options);
        if (未执行原因) {
            return 构造未执行结果(今天, 未执行原因);
        }

        const 玩家列表 = await ctx.database.get("征战玩家表", {});

        if (玩家列表.length === 0) {
            await 记录统计日期(ctx, 今天);
            return 构造无新闻执行结果({
                今天,
                玩家数量: 0,
                平均工资: 0,
                平均科技等级: 0,
            });
        }

        const { 平均工资, 平均科技等级 } = 计算玩家平均值(玩家列表);
        const 全局数据 = await 读取或初始化全局数据(ctx, 平均工资, 平均科技等级);

        if (!全局数据.已初始化) {
            await 记录统计日期(ctx, 今天);
            return 构造无新闻执行结果({
                今天,
                玩家数量: 玩家列表.length,
                平均工资,
                平均科技等级,
            });
        }

        return await 更新全局数据并通报(ctx, {
            今天,
            玩家数量: 玩家列表.length,
            平均工资,
            平均科技等级,
            昨日全球生产总值: 全局数据.昨日全球生产总值,
            历史生产记录: 全局数据.历史生产记录,
        });
    } catch (error) {
        const 错误信息 = error instanceof Error ? error.message : "未知错误";
        await 尝试发送后台信号塔日志(ctx, {
            级别: "ERROR",
            标题: "全服数据统计异常",
            内容: 错误信息,
        });
        throw error;
    } finally {
        正在执行全服统计 = false;
    }
}
