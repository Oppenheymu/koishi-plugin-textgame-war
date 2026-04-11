import {
    Context
} from "koishi";
import {
    地区查询权限检查,
} from "../../../../utils";

const 格式化 = (n: number) => n.toLocaleString("zh-CN");

export function 查看地区核反应堆(ctx: Context) {
    ctx.command("查看地区核反应堆 [地区编号:string]")
        .alias("查看城市核反应堆")
        .alias("核反应堆")
        .alias("地区核反应堆")
        .alias("城市核反应堆")
        .action(async ({
            session
        }, 地区编号参数) => {
            try {
                const {
                    地区编号,
                    地区战略资料,
                    展示地区名称
                } = await 地区查询权限检查(
                    ctx,
                    session,
                    "查看地区核反应堆",
                    地区编号参数
                );

                const 反应堆列表 = Object.entries(地区战略资料.核反应堆 ?? {});

                const 反应堆展示 = 反应堆列表.length
                    ? 反应堆列表
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([编号, 反应堆]) => {
                            const 最近日志 = (反应堆.日志 ?? [])
                                .slice(0, 3)
                                .map((日志) => `      · ${日志.时间}，${日志.制备者} 制备 ${日志.制备物} × ${格式化(日志.数量)}`)
                                .join("\n") || "      · 暂无制备记录";

                            return [
                                `  - 反应堆#${编号}`,
                                `    · 状态：${反应堆.是否运行中 ? "运行中" : "停机"}`,
                                `    · 已投入生产力：${格式化(反应堆.已投入生产力)}`,
                                `    · 建造时间：${反应堆.建造时间 || "未知"}`,
                                "    · 最近制备：",
                                最近日志,
                            ].join("\n");
                        })
                        .join("\n")
                    : "  - 暂无核反应堆记录";

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
                return (error as Error).message;
            }
        });
}
