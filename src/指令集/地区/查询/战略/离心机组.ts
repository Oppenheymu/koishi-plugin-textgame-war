import type { Context } from "koishi";
import { 地区查询权限检查 } from "#/logic";
import { 特殊建筑库 } from "../../建筑/config";

export function 查看地区离心机组(ctx: Context) {
    ctx.command("查看地区离心机组 [地区编号:string]")
        .alias("查看城市离心机组")
        .alias("高速离心级联")
        .alias("地区离心机组")
        .alias("城市离心机组")
        .action(async ({ session }, 地区编号参数) => {
            try {
                const { 地区编号, 地区战略资料, 展示地区名称 } = await 地区查询权限检查(
                    ctx,
                    session,
                    "查看地区离心机组",
                    地区编号参数,
                );

                const 离心机组列表 = Object.entries(地区战略资料.高速离心级联 ?? {});

                const 建造需求 = 特殊建筑库.高速离心级联.生产力需求;

                const 离心机组展示 = 离心机组列表.length
                    ? 离心机组列表
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([编号, 离心机组信息]) => {
                              const 最近日志 =
                                  (离心机组信息.日志 ?? [])
                                      .slice(0, 2)
                                      .map(
                                          (日志) =>
                                              `      · ${日志.时间}，${日志.制备者} 制备 ${日志.制备物} x${日志.数量}`,
                                      )
                                      .join("\n") || "      · 暂无制备记录";

                              const 百分比 = ((离心机组信息.建造进度 / 建造需求) * 100).toFixed(1);

                              return [
                                  `  - 离心机组#${编号}`,
                                  `    · 状态：${离心机组信息.是否制备中 ? "制备中" : "空闲"}`,
                                  `    · 建造进度：${百分比}%`,
                                  `    · 建造时间：${离心机组信息.建造时间 || "未记录"}`,
                                  "    · 最近制备：",
                                  最近日志,
                              ].join("\n");
                          })
                          .join("\n")
                    : "  - 暂无高速离心级联";

                return [
                    "【地区高速离心级联】",
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 司令：${地区战略资料.地区司令 || "暂无"}`,
                    `■ 离心机组数量：${离心机组列表.length}`,
                    "□ 离心机组详情：",
                    离心机组展示,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}
