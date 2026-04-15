import {
    Context
} from "koishi";
import {
    尝试发送后台信号塔日志,
    尝试发送新闻信号塔通报
} from "@/logic";
import {
    确保服务记录
} from "@/utils/服务记录";

let 正在执行全服统计 = false;

export interface 全服统计执行结果 {
    今天: string;
    是否执行: boolean;
    原因?: string;
    玩家数量: number;
    平均工资: number;
    平均科技等级: number;
    昨日全球生产总值: number;
    新闻已发送数量: number;
    新闻发送失败数量: number;
}

function 获取今天日期(): string {
    const 现在 = new Date();
    return `${现在.getFullYear()}-${String(现在.getMonth() + 1).padStart(2, "0")}-${String(
        现在.getDate()
    ).padStart(2, "0")}`;
}

function 构建全服统计新闻内容(参数: {
    今天: string;
    玩家数量: number;
    平均工资: number;
    平均科技等级: number;
    昨日全球生产总值: number;
    近三天全球生产总值: number;
    近七天全球生产总值: number;
}): string {
    const 格式化 = (n: number) => n.toLocaleString("zh-CN");

    return [
        `日期：${参数.今天}`,
        `玩家总数：${格式化(参数.玩家数量)}`,
        `全球平均工资：${格式化(参数.平均工资)}`,
        `全球平均科技等级：${格式化(参数.平均科技等级)}`,
        `昨日全球生产总值：${格式化(参数.昨日全球生产总值)}`,
        `近三天全球生产总值：${格式化(参数.近三天全球生产总值)}`,
        `近七天全球生产总值：${格式化(参数.近七天全球生产总值)}`,
    ].join("\n");
}

export async function 执行每日全服统计(
    ctx: Context,
    options?: {
        忽略日期检查?: boolean;
    }
): Promise<全服统计执行结果> {
    if (正在执行全服统计) {
        return {
            今天: 获取今天日期(),
            是否执行: false,
            原因: "全服统计正在执行中",
            玩家数量: 0,
            平均工资: 0,
            平均科技等级: 0,
            昨日全球生产总值: 0,
            新闻已发送数量: 0,
            新闻发送失败数量: 0,
        };
    }

    正在执行全服统计 = true;
    const logger = ctx.logger("全服数据统计");

    try {
        const 今天 = 获取今天日期();

        const [服务记录] = await ctx.database.get("马列服务表", {
            id: "service",
        });

        if (!服务记录) {
            await 确保服务记录(ctx, {
                上次全服统计日期: 今天,
            });
        } else if (!options?.忽略日期检查) {
            const 上次统计时间 = 服务记录.上次全服统计日期;
            if (上次统计时间 && 今天 <= 上次统计时间) {
                return {
                    今天,
                    是否执行: false,
                    原因: `今日已统计（上次统计日期：${上次统计时间}）`,
                    玩家数量: 0,
                    平均工资: 0,
                    平均科技等级: 0,
                    昨日全球生产总值: 0,
                    新闻已发送数量: 0,
                    新闻发送失败数量: 0,
                };
            }
        }

        const players = await ctx.database.get("马列玩家表", {});

        if (players.length === 0) {
            await ctx.database.set(
                "马列服务表",
                { id: "service" },
                { 上次全服统计日期: 今天 }
            );

            return {
                今天,
                是否执行: true,
                玩家数量: 0,
                平均工资: 0,
                平均科技等级: 0,
                昨日全球生产总值: 0,
                新闻已发送数量: 0,
                新闻发送失败数量: 0,
            };
        }

        let totalWage = 0;
        let totalTech = 0;

        for (const player of players) {
            totalWage += player.工人工资;
            totalTech += player.科技等级;
        }

        const avgWage = Math.floor(totalWage / players.length);
        const avgTech = Math.floor(totalTech / players.length);

        const [currentGlobal] = await ctx.database.get("马列全球数据表", {
            id: "global",
        });

        let todayProduction = 0;
        let history: number[] = [];

        if (!currentGlobal) {
            await ctx.database.create("马列全球数据表", {
                id: "global",
                全球平均工资: avgWage,
                全球平均科技等级: avgTech,
                历史生产记录: [],
                今日全球生产总值: 0,
                近三天全球生产总值: 0,
                近七天全球生产总值: 0,
            });
        } else {
            todayProduction = currentGlobal.今日全球生产总值 || 0;
            history = [...(currentGlobal.历史生产记录 || []), todayProduction];
            if (history.length > 7) {
                history = history.slice(-7);
            }

            const 近三天全球生产总值 = history
                .slice(-3)
                .reduce((a, b) => a + b, 0);
            const 近七天全球生产总值 = history
                .slice(-7)
                .reduce((a, b) => a + b, 0);

            await ctx.database.set(
                "马列全球数据表",
                { id: "global" },
                {
                    全球平均工资: avgWage,
                    全球平均科技等级: avgTech,
                    历史生产记录: history,
                    近三天全球生产总值,
                    近七天全球生产总值,
                    今日全球生产总值: 0,
                }
            );

            const 新闻结果 = await 尝试发送新闻信号塔通报(ctx, {
                标题: "全服基础数据日报",
                内容: 构建全服统计新闻内容({
                    今天,
                    玩家数量: players.length,
                    平均工资: avgWage,
                    平均科技等级: avgTech,
                    昨日全球生产总值: todayProduction,
                    近三天全球生产总值,
                    近七天全球生产总值,
                }),
            });

            await ctx.database.set(
                "马列服务表",
                { id: "service" },
                { 上次全服统计日期: 今天 }
            );

            logger.info(
                `统计完成：平均工资=${avgWage}，平均科技=${avgTech}，昨日产值=${todayProduction}`
            );

            return {
                今天,
                是否执行: true,
                玩家数量: players.length,
                平均工资: avgWage,
                平均科技等级: avgTech,
                昨日全球生产总值: todayProduction,
                新闻已发送数量: 新闻结果?.已发送.length ?? 0,
                新闻发送失败数量: 新闻结果?.发送失败.length ?? 0,
            };
        }

        await ctx.database.set(
            "马列服务表",
            { id: "service" },
            { 上次全服统计日期: 今天 }
        );

        return {
            今天,
            是否执行: true,
            玩家数量: players.length,
            平均工资: avgWage,
            平均科技等级: avgTech,
            昨日全球生产总值: 0,
            新闻已发送数量: 0,
            新闻发送失败数量: 0,
        };
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

export function 每日全服数据统计(ctx: Context) {
    ctx.cron("*/5 * * * *", () => {
        执行每日全服统计(ctx).catch((error) => {
            ctx.logger("全服数据统计").error(error);
        });
    });
}
