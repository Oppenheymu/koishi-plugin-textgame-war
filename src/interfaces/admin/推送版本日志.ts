import type { Context } from "koishi";
import { 格式化版本日志, 获取版本日志 } from "#/infrastructure";
import { 发送联军信号塔通报 } from "#ctx/beacon";

export function 推送版本日志(ctx: Context) {
    ctx.command("推送版本日志 [版本号]", "向全服所有联军首都推送版本日志", {
        authority: 3, // 三级权限
    }).action(async (_, 版本号) => {
        // 获取版本日志
        const 日志 = 获取版本日志(版本号);
        if (!日志) {
            return `找不到版本 ${版本号} 的日志`;
        }

        // 查询所有联军
        // biome-ignore lint/suspicious/noImplicitAnyLet: 数据库查询结果类型不明确，使用 let 定义
        let 全部联军;
        try {
            全部联军 = await ctx.database.get("征战联军表", {});
        } catch (error) {
            return `查询联军列表失败: ${error}`;
        }

        if (全部联军.length === 0) {
            return "当前没有联军";
        }

        // 逐个推送版本日志到每个联军首都
        const 推送结果 = {
            成功: [] as string[],
            失败: [] as Array<{ 联军编号: string; 原因: string }>,
        };

        for (const 联军资料 of 全部联军) {
            try {
                // 跳过没有首都的联军
                if (!联军资料.联军首都) {
                    推送结果.失败.push({
                        联军编号: 联军资料.联军编号,
                        原因: "未设置首都地区",
                    });
                    continue;
                }

                await 发送联军信号塔通报(ctx, {
                    通报标题: "📋 版本更新通知",
                    联军编号: 联军资料.联军编号,
                    通报内容: 格式化版本日志(日志),
                });

                推送结果.成功.push(联军资料.联军编号);
            } catch (error) {
                推送结果.失败.push({
                    联军编号: 联军资料.联军编号,
                    原因: String(error),
                });
            }
        }

        // 组装返回信息
        const 返回行列 = [
            `📢 版本 ${日志.版本} 推送完成`,
            `成功: ${推送结果.成功.length}/${全部联军.length}`,
        ];

        if (推送结果.成功.length > 0) {
            返回行列.push(`✅ ${推送结果.成功.join(", ")}`);
        }

        if (推送结果.失败.length > 0) {
            返回行列.push("❌ 失败:", ...推送结果.失败.map((f) => `  - ${f.联军编号}: ${f.原因}`));
        }

        return 返回行列.join("\n");
    });
}
