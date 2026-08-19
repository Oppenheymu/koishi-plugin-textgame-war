import dayjs from "dayjs";
import type { Context } from "koishi";
import { 下达命令工作流, 进军工作流 } from "#/logic";
import { 军队命令 } from "#/types";
import { 军队解析, 玩家联军检查 } from "#/utils";

export function 进军(ctx: Context) {
    ctx.command("进军 <编号:number> <地区编号:string>")
        .alias("军队进军")
        .alias("行军")
        .action(async ({ session }, 编号, 地区编号) => {
            try {
                const 结果 = await 玩家联军检查(ctx, session);
                const 军队 = await 军队解析(ctx, 编号);
                if (军队.所属联军编号 !== 结果.联军编号) {
                    return "只能指挥本联军的军队";
                }

                const { 行军分钟数, 预计到达时间 } = await 进军工作流(
                    ctx,
                    军队,
                    地区编号 ?? "",
                    结果.uid,
                );

                const 时长文本 =
                    行军分钟数 >= 60
                        ? `${Math.floor(行军分钟数 / 60)} 小时 ${Math.round(行军分钟数 % 60)} 分钟`
                        : `${Math.ceil(行军分钟数)} 分钟`;

                return [
                    "====[进军]====",
                    `军队 #${军队.id}（${军队.名称}）已向 ${地区编号} 开拔`,
                    `■ 预计行军：${时长文本}`,
                    `■ 预计到达：${dayjs(预计到达时间).format("MM-DD HH:mm")}`,
                    "■ 若目标地区有敌军驻扎，抵达后将触发战斗",
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}

function 注册战斗命令(ctx: Context, 指令名: string, 命令: 军队命令, 提示: string) {
    ctx.command(`${指令名} <编号:number>`).action(async ({ session }, 编号) => {
        try {
            const 结果 = await 玩家联军检查(ctx, session);
            const 军队 = await 军队解析(ctx, 编号);
            if (军队.所属联军编号 !== 结果.联军编号) {
                return "只能指挥本联军的军队";
            }

            await 下达命令工作流(ctx, 军队, 命令, 结果.uid);
            return `军队 #${军队.id}（${军队.名称}）${提示}`;
        } catch (error) {
            return (error as Error).message;
        }
    });
}

export function 撤退(ctx: Context) {
    注册战斗命令(ctx, "撤退", 军队命令.撤退, "已接到撤退命令，将在下一轮结算时撤离战斗");
}

export function 死守(ctx: Context) {
    注册战斗命令(
        ctx,
        "死守",
        军队命令.死守,
        "已接到死守命令：组织度归零也不会撤退，战至最后一兵一卒",
    );
}

export function 取消死守(ctx: Context) {
    注册战斗命令(ctx, "取消死守", 军队命令.正常, "死守命令已取消，恢复正常作战");
}
