import { Context } from "koishi";
import dayjs from "dayjs";

let 正在执行每日重置 = false;

function 获取今天日期(): string {
    return dayjs().format("YYYY-MM-DD");
}

export async function 初始化服务记录(
    ctx: Context,
): Promise<{ created: boolean; 今天: string }> {
    const 今天 = 获取今天日期();
    const 全局状态机 = await ctx.database.get("马列服务表", { id: "service" });
    const 服务记录 = 全局状态机[0];

    if (服务记录) {
        return { created: false, 今天 };
    }

    await ctx.database.create("马列服务表", {
        id: "service",
        上次重置签到日期: 今天,
        上次全服统计日期: 今天,
    });

    return { created: true, 今天 };
}

/**
 * 执行每日重置
 */
async function 执行每日重置(ctx: Context): Promise<void> {
    if (正在执行每日重置) return;
    正在执行每日重置 = true;

    try {
        const { created, 今天 } = await 初始化服务记录(ctx);
        const 全局状态机 = await ctx.database.get("马列服务表", {
            id: "service",
        });
        const 服务记录 = 全局状态机[0];

        if (!服务记录) return;

        const 上次重置时间 = 服务记录.上次重置签到日期;

        if (created || !上次重置时间 || 今天 > 上次重置时间) {
            if (!created) {
                await ctx.database.set(
                    "马列服务表",
                    { id: "service" },
                    {
                        上次重置签到日期: 今天,
                    },
                );
            }

            await ctx.database.set(
                "马列玩家表",
                {},
                { 今日是否签到: false, 工人招募限额: 1000 },
            );
        }
    } finally {
        正在执行每日重置 = false;
    }
}

/**
 * 启动每日重置检查定时任务
 * 使用 cron 轮询：每5分钟检查一次，比 setInterval 更可靠
 */
export function 每日重置签到检查(ctx: Context) {
    ctx.cron("*/5 * * * *", () => {
        执行每日重置(ctx);
    });
}
