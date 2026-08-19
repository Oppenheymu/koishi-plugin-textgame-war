import type { Context } from "koishi";
import { 尝试发送后台信号塔日志 } from "#ctx/beacon/后台";
import { 尝试发送新闻信号塔通报 } from "#ctx/beacon/新闻";
import { 推送联军生产总值排行新闻 } from "#ctx/coalition/application/生产总值统计/排行榜";
import { 执行联军资本增量日结 } from "#ctx/coalition/application/生产总值统计/资本日结";
import { 执行每日全服统计 } from "#ctx/world/application/stats/全服统计";
import { 格式化 } from "#shared/format";

function 构建排行文本(
    排行: {
        排名: number;
        联军编号: string;
        展示联军名称: string;
        生产总值: number;
    }[],
): string {
    if (!排行.length) {
        return "暂无联军数据";
    }

    return 排行
        .map((项) => {
            return `${项.排名}. ${项.展示联军名称}（${项.联军编号}）：${格式化(项.生产总值)}`;
        })
        .join("\n");
}

export function 信号塔调试(ctx: Context) {
    ctx.command("信号塔新闻测试 <标题:string> <内容:text>", {
        authority: 3,
    }).action(async (_, 标题, 内容) => {
        try {
            const 结果 = await 尝试发送新闻信号塔通报(ctx, {
                标题,
                内容,
            });

            if (!结果) {
                return "新闻信号塔测试失败，请检查后台日志";
            }

            return `新闻通报已执行：成功 ${结果.已发送.length}，失败 ${结果.发送失败.length}`;
        } catch (error) {
            return (error as Error).message;
        }
    });

    ctx.command("信号塔后台测试 <内容:text>", {
        authority: 3,
    }).action(async (_, 内容) => {
        try {
            const 结果 = await 尝试发送后台信号塔日志(ctx, {
                标题: "后台测试消息",
                级别: "INFO",
                内容,
            });

            if (!结果) {
                return "后台信号塔测试失败，请检查后台日志";
            }

            return `后台日志已执行：成功 ${结果.已发送.length}，失败 ${结果.发送失败.length}`;
        } catch (error) {
            return (error as Error).message;
        }
    });

    ctx.command("调试全服数据统计", {
        authority: 3,
    }).action(async () => {
        try {
            const 结果 = await 执行每日全服统计(ctx, {
                忽略日期检查: true,
            });

            if (!结果.是否执行) {
                return `全服统计未执行：${结果.原因 ?? "未知原因"}`;
            }

            return [
                "全服统计调试完成：",
                `日期：${结果.今天}`,
                `玩家数量：${格式化(结果.玩家数量)}`,
                `平均工资：${格式化(结果.平均工资)}`,
                `平均科技等级：${格式化(结果.平均科技等级)}`,
                `昨日全球生产总值：${格式化(结果.昨日全球生产总值)}`,
                `新闻推送：成功 ${结果.新闻已发送数量} / 失败 ${结果.新闻发送失败数量}`,
            ].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });

    ctx.command("调试联军生产总值统计", {
        authority: 3,
    }).action(async () => {
        try {
            const 结果 = await 执行联军资本增量日结(ctx, {
                忽略日期检查: true,
                推送新闻: true,
            });

            if (!结果.是否执行) {
                return `联军统计未执行：${结果.原因 ?? "未知原因"}`;
            }

            return [
                "联军生产总值统计调试完成：",
                `日期：${结果.今天}`,
                `联军数量：${格式化(结果.联军数量)}`,
                `新闻推送：成功 ${结果.新闻已发送数量} / 失败 ${结果.新闻发送失败数量}`,
                "TOP10：",
                构建排行文本(结果.排行榜),
            ].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });

    ctx.command("推送联军生产总值排行", {
        authority: 3,
    }).action(async () => {
        try {
            const 联军列表 = await ctx.database.get("马列联军表", {});
            const 今天 = new Date();
            const 日期标题 = `${今天.getFullYear()}-${String(今天.getMonth() + 1).padStart(2, "0")}-${String(
                今天.getDate(),
            ).padStart(2, "0")} 全球联军生产总值TOP10`;

            const 推送结果 = await 推送联军生产总值排行新闻(ctx, {
                标题: 日期标题,
                联军列表,
            });

            return [
                "联军生产总值排行推送完成：",
                `成功：${推送结果.新闻已发送数量}`,
                `失败：${推送结果.新闻发送失败数量}`,
                "TOP10：",
                构建排行文本(推送结果.排行榜),
            ].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });
}
