import {
    Context
} from "koishi";
import {
    尝试发送后台信号塔日志,
    尝试发送新闻信号塔通报
} from "@/logic";
import {
    CoalitionArmy
} from "@/types";
import {
    获取联军展示名称
} from "@/utils";
import {
    确保服务记录
} from "@/utils/服务记录";

let 正在执行联军资本统计 = false;

export interface 联军生产总值排行项 {
    排名: number;
    联军编号: string;
    展示联军名称: string;
    生产总值: number;
}

export interface 联军生产总值排行推送结果 {
    标题: string;
    排行榜: 联军生产总值排行项[];
    新闻已发送数量: number;
    新闻发送失败数量: number;
}

export interface 联军资本统计执行结果 {
    今天: string;
    是否执行: boolean;
    原因?: string;
    联军数量: number;
    排行榜: 联军生产总值排行项[];
    新闻已发送数量: number;
    新闻发送失败数量: number;
}

const 格式化日期 = (时间: Date) =>
    `${时间.getFullYear()}-${String(时间.getMonth() + 1).padStart(2, "0")}-${String(
        时间.getDate()
    ).padStart(2, "0")}`;

const 格式化数值 = (n: number) => n.toLocaleString("zh-CN");

function 计算区间资本增量(历史记录: number[], 当天内资本增量: number) {
    const 近三天 = 历史记录.slice(-2).reduce((总和, 数值) => 总和 + 数值, 0) + 当天内资本增量;
    const 近七天 = 历史记录.slice(-6).reduce((总和, 数值) => 总和 + 数值, 0) + 当天内资本增量;

    return {
        近三天,
        近七天,
    };
}

function 生成联军生产总值排行榜(联军列表: CoalitionArmy[]): 联军生产总值排行项[] {
    return [...联军列表]
        .sort((a, b) => (b.当天内资本增量 ?? 0) - (a.当天内资本增量 ?? 0))
        .slice(0, 10)
        .map((联军资料, 索引) => ({
            排名: 索引 + 1,
            联军编号: 联军资料.联军编号,
            展示联军名称: 获取联军展示名称(联军资料),
            生产总值: 联军资料.当天内资本增量 ?? 0,
        }));
}

function 构建排行榜新闻文本(排行榜: 联军生产总值排行项[]): string {
    if (!排行榜.length) {
        return "今日暂无可统计联军数据。";
    }

    return 排行榜.map((项) => {
        return `${项.排名}. ${项.展示联军名称}（${项.联军编号}）：${格式化数值(项.生产总值)}`;
    }).join("\n");
}

export async function 推送联军生产总值排行新闻(
    ctx: Context,
    参数: {
        标题?: string;
        排行榜?: 联军生产总值排行项[];
        联军列表?: CoalitionArmy[];
    } = {}
): Promise<联军生产总值排行推送结果> {
    const 标题 = 参数.标题?.trim() || "全球联军生产总值TOP10";
    const 排行榜 = 参数.排行榜 ?? 生成联军生产总值排行榜(参数.联军列表 ?? []);

    const 新闻结果 = await 尝试发送新闻信号塔通报(ctx, {
        标题,
        内容: 构建排行榜新闻文本(排行榜),
    });

    return {
        标题,
        排行榜,
        新闻已发送数量: 新闻结果?.已发送.length ?? 0,
        新闻发送失败数量: 新闻结果?.发送失败.length ?? 0,
    };
}

export async function 记录联军资本增量(
    ctx: Context,
    联军编号: string,
    当次资本增量: number,
    本次上缴生活资料 = 0
): Promise<void> {
    const 安全增量 = Math.max(0, 当次资本增量);
    const 安全上缴 = Math.max(0, Math.floor(本次上缴生活资料));

    if (安全增量 <= 0 && 安全上缴 <= 0) return;

    const [联军资料] = await ctx.database.get("马列联军表", { 联军编号 });
    if (!联军资料) return;

    const 当前当天增量 = (联军资料.当天内资本增量 ?? 0) + 安全增量;
    const 历史记录 = 联军资料.资本增量历史记录 ?? [];
    const { 近三天, 近七天 } = 计算区间资本增量(历史记录, 当前当天增量);

    await ctx.database.set(
        "马列联军表",
        { 联军编号 },
        {
            联军生活资料: (联军资料.联军生活资料 ?? 0) + 安全上缴,
            当天内资本增量: 当前当天增量,
            三天内资本增量: 近三天,
            七天内资本增量: 近七天,
        }
    );
}

export async function 执行联军资本增量日结(
    ctx: Context,
    options?: {
        忽略日期检查?: boolean;
        推送新闻?: boolean;
    }
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

        const [服务记录] = await ctx.database.get("马列服务表", { id: "service" });

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
                }
            );
        }

        await ctx.database.set(
            "马列服务表",
            { id: "service" },
            { 上次联军资本统计日期: 今天 }
        );

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

export function 每日联军资本增量统计(ctx: Context) {
    ctx.cron("*/5 * * * *", () => {
        执行联军资本增量日结(ctx).catch((error) => {
            ctx.logger("联军生产总值统计").error(error);
        });
    });
}
