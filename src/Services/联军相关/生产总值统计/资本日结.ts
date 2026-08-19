import type { Context } from "koishi";
import { 确保服务记录 } from "#/infrastructure";
import { 尝试发送后台信号塔日志 } from "#/logic";
import { 服务事件中心, 格式化日期 } from "../../utils/index.js";
import type { 联军资本统计执行结果 } from "./types.js";
import { 推送联军生产总值排行新闻, 生成联军生产总值排行榜 } from "./排行榜.js";

let 正在执行联军资本统计 = false;

export async function 执行联军资本增量日结(
    ctx: Context,
    options?: { 忽略日期检查?: boolean; 推送新闻?: boolean },
): Promise<联军资本统计执行结果> {
    if (正在执行联军资本统计) {
        return {
            今天: 格式化日期(new Date()),
            是否执行: false,
            原因: "联军资本统计正在执行中",
            联军数量: 0,
            排行榜: [],
            新闻已发送数量: 0,
            新闻发送失败数量: 0,
        };
    }

    正在执行联军资本统计 = true;

    try {
        const 今天 = 格式化日期(new Date());
        const [服务记录] = await ctx.database.get("马列服务表", {
            id: "service",
        });

        if (!服务记录) {
            await 确保服务记录(ctx, { 上次联军资本统计日期: 今天 });
            return {
                今天,
                是否执行: false,
                原因: "未找到service记录，已自动初始化",
                联军数量: 0,
                排行榜: [],
                新闻已发送数量: 0,
                新闻发送失败数量: 0,
            };
        }

        if (!options?.忽略日期检查) {
            if (服务记录.上次联军资本统计日期 && 服务记录.上次联军资本统计日期 >= 今天) {
                return {
                    今天,
                    是否执行: false,
                    原因: `今日已结算（上次结算日期：${服务记录.上次联军资本统计日期}）`,
                    联军数量: 0,
                    排行榜: [],
                    新闻已发送数量: 0,
                    新闻发送失败数量: 0,
                };
            }
        }

        const 联军列表 = await ctx.database.get("马列联军表", {});
        const 排行榜 = 生成联军生产总值排行榜(联军列表);

        let 新闻已发送数量 = 0;
        let 新闻发送失败数量 = 0;

        if (options?.推送新闻 ?? true) {
            const 推送结果 = await 推送联军生产总值排行新闻(ctx, {
                标题: `${今天} 全球联军生产总值TOP10`,
                排行榜,
            });
            新闻已发送数量 = 推送结果.新闻已发送数量;
            新闻发送失败数量 = 推送结果.新闻发送失败数量;
        }

        for (const 联军资料 of 联军列表) {
            const 昨日增量 = 联军资料.当天内资本增量 ?? 0;
            let 历史记录 = [...(联军资料.资本增量历史记录 ?? []), 昨日增量];

            if (历史记录.length > 7) {
                历史记录 = 历史记录.slice(-7);
            }

            const 三天合计 = 历史记录.slice(-3).reduce((总和, 数值) => 总和 + 数值, 0);
            const 七天合计 = 历史记录.slice(-7).reduce((总和, 数值) => 总和 + 数值, 0);

            await ctx.database.set(
                "马列联军表",
                { 联军编号: 联军资料.联军编号 },
                {
                    当天内资本增量: 0,
                    三天内资本增量: 三天合计,
                    七天内资本增量: 七天合计,
                    资本增量历史记录: 历史记录,
                },
            );
        }

        await ctx.database.set("马列服务表", { id: "service" }, { 上次联军资本统计日期: 今天 });

        服务事件中心.emit("联军相关:资本日结完成", {
            日期: 今天,
            联军数量: 联军列表.length,
        });

        return {
            今天,
            是否执行: true,
            联军数量: 联军列表.length,
            排行榜,
            新闻已发送数量,
            新闻发送失败数量,
        };
    } catch (error) {
        const 错误信息 = error instanceof Error ? error.message : "未知错误";
        await 尝试发送后台信号塔日志(ctx, {
            级别: "ERROR",
            标题: "联军生产总值统计异常",
            内容: 错误信息,
        });
        throw error;
    } finally {
        正在执行联军资本统计 = false;
    }
}
