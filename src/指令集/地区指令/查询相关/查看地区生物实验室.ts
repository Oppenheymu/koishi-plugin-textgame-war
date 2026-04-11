import {
    Context
} from "koishi";
import {
    玩家联军检查,
    地区解析,
    当前地区解析
} from "../../../utils";

const 格式化 = (n: number) => n.toLocaleString("zh-CN");

export function 查看地区生物实验室(ctx: Context) {
    ctx.command("查看地区生物实验室 [地区编号:string]")
        .alias("查看城市生物实验室")
        .alias("生物实验室")
        .alias("菌毒种库")
        .alias("地区生物实验室")
        .alias("城市生物实验室")
        .action(async ({
            session
        }, 地区编号参数) => {
            try {
                await 玩家联军检查(ctx, session, {
                    最低权限等级: 3,
                    是否必须在成员列表: true,
                });

                const 规范地区编号 = 地区编号参数?.trim();
                const {
                    地区编号,
                    地区战略资料,
                    展示地区名称
                } = 规范地区编号
                    ?
                    await 地区解析(ctx, 规范地区编号) :
                    await 当前地区解析(ctx, session);

                const 实验室列表 = Object.entries(地区战略资料.生物实验室 ?? {});

                const 实验室展示 = 实验室列表.length
                    ? 实验室列表
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([编号, 实验室]) => {
                            const 最近日志 = (实验室.日志 ?? [])
                                .slice(0, 3)
                                .map((日志) => `      · ${日志.时间}，${日志.制备者} 制备 ${日志.制备物} × ${格式化(日志.数量)}`)
                                .join("\n") || "      · 暂无制备记录";

                            return [
                                `  - 实验室#${编号}`,
                                `    · 状态：${实验室.是否制备中 ? "制备中" : "空闲"}`,
                                `    · 已投入生产力：${格式化(实验室.已投入生产力)}`,
                                `    · 建造时间：${实验室.建造时间 || "未知"}`,
                                "    · 最近制备：",
                                最近日志,
                            ].join("\n");
                        })
                        .join("\n")
                    : "  - 暂无生物实验室记录";

                return [
                    "【地区生物实验室】",
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 司令：${地区战略资料.地区司令 || "暂无"}`,
                    `■ 实验室数量：${实验室列表.length}`,
                    "□ 实验室详情：",
                    实验室展示,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}
