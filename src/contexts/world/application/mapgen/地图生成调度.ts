import type { Context } from "koishi";
import { GenerateMap } from "#ctx/world/application/mapgen/地图生成";

import { 清理过期缓存 } from "#ctx/world/application/mapgen/缓存管理";

function 地图生成调度(ctx: Context) {
    ctx.cron("0 * * * *", async () => {
        console.info("[MapGenerator] 定时任务：生成全尺寸世界地图...");
        const buffer = await GenerateMap(ctx);
        if (buffer) {
            console.info("[MapGenerator] 世界地图已生成并缓存。");
        } else {
            console.error("[MapGenerator] 定时任务未能生成地图图片。");
        }
    });

    ctx.cron("0 */10 * * * *", async () => {
        await 清理过期缓存();
    });

    ctx.command("生成世界地图", { authority: 4 })
        .alias("生成地图")
        .action(async () => {
            console.info("[MapGenerator] 手动生成世界地图...");
            const buffer = await GenerateMap(ctx);
            if (buffer) {
                return "世界地图已生成并缓存。";
            }
            return "生成地图失败，请检查后台日志。";
        });
}

export const 地图生成服务列表 = [地图生成调度];
