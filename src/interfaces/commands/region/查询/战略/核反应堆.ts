import type { Context } from "koishi";
import { Logger } from "koishi";
import { 特殊建筑库 } from "#/interfaces/commands/region/建筑/config";
import { 地区查询权限检查 } from "#ctx/region";

const logger = new Logger("核反应堆查询");

export function 查看地区核反应堆(ctx: Context) {
    ctx.command("查看地区核反应堆 [地区编号:string]")
        .alias("查看城市核反应堆")
        .alias("核反应堆")
        .alias("地区核反应堆")
        .alias("城市核反应堆")
        .action(async ({ session }, 地区编号参数) => {
            try {
                const { 地区编号, 地区战略资料, 展示地区名称 } = await 地区查询权限检查(
                    ctx,
                    session,
                    "查看地区核反应堆",
                    地区编号参数,
                );

                const 反应堆列表 = Object.entries(地区战略资料.核反应堆 ?? {});

                const 建造需求 = 特殊建筑库.核反应堆.生产力需求;

                const 反应堆展示 = 反应堆列表.length
                    ? 反应堆列表
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([编号, 反应堆信息]) => {
                              const 最近日志 =
                                  (反应堆信息.日志 ?? [])
                                      .slice(0, 2)
                                      .map(
                                          (日志) =>
                                              `      · ${日志.时间}，${日志.制备者} 制备 ${日志.制备物} x${日志.数量}`,
                                      )
                                      .join("\n") || "      · 暂无制备记录";

                              const 百分比 = ((反应堆信息.建造进度 / 建造需求) * 100).toFixed(1);
                              return [
                                  `  - 反应堆#${编号}`,
                                  `    · 状态：${反应堆信息.是否制备中 ? "制备中" : "空闲"}`,
                                  `    · 建造进度：${百分比}%`,
                                  `    · 建造时间：${反应堆信息.建造时间 || "未记录"}`,
                                  "    · 最近制备：",
                                  最近日志,
                              ].join("\n");
                          })
                          .join("\n")
                    : "  - 暂无核反应堆";

                return [
                    "【地区核反应堆】",
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 司令：${地区战略资料.地区司令 || "暂无"}`,
                    `■ 反应堆数量：${反应堆列表.length}`,
                    "□ 反应堆详情：",
                    反应堆展示,
                ].join("\n");
            } catch (error) {
                logger.error(`[查询错误]:`, error);
                return (error as Error).message;
            }
        });
}
