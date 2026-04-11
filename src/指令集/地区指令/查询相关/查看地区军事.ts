import {
    Context
} from "koishi";
import {
    地区查询权限检查,
} from "@/utils";

const 格式化 = (n: number) => n.toLocaleString("zh-CN");

export function 查看地区军事(ctx: Context) {
    ctx.command("查看地区军事 [地区编号:string]")
        .alias("查看城市军事")
        .alias("军事基地")
        .alias("地区军事")
        .alias("城市军事")
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
                    "查看地区军事",
                    地区编号参数
                );

                const 历史战争记录 = 地区战略资料.历史战争 ?? [];
                const 历史战争展示 = 历史战争记录.length ?
                    历史战争记录
                    .slice(0, 3)
                    .map(
                        ({
                            时间,
                            发动者,
                            记录
                        }) =>
                        `    - ${时间}，玩家${发动者}，进行了${记录}`
                    )
                    .join("\n") :
                    "    - 暂无记录";

                return [
                    "【城市信息】",
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 司令：${地区战略资料.地区司令 || "暂无"}`,
                    `□ 驻军：${格式化(地区战略资料.地区驻军)}`,
                    `□ 要塞：${格式化(地区战略资料.地区堡垒)}`,
                    "□ 历史战争：",
                    历史战争展示,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}
