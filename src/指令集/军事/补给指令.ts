import type { Context } from "koishi";
import { 分配装备工作流, 扩军工作流, 裁军工作流 } from "#/logic";
import { 格式化, 军队解析, 玩家联军检查  } from "#/utils";


export function 分配装备(ctx: Context) {
    ctx.command("分配装备 <编号:number> <装备:string> <数量:number>").action(
        async ({ session }, 编号, 装备, 数量) => {
            try {
                const 结果 = await 玩家联军检查(ctx, session);
                const 军队 = await 军队解析(ctx, 编号);
                if (军队.所属联军编号 !== 结果.联军编号) {
                    return "只能操作本联军的军队";
                }

                const { 实际数量 } = await 分配装备工作流(ctx, 军队, 结果, 装备 ?? "", 数量);

                return 实际数量 > 0
                    ? `已向军队 #${军队.id} 拨出【${装备}】×${格式化(实际数量)}`
                    : `已从军队 #${军队.id} 回收【${装备}】×${格式化(-实际数量)}`;
            } catch (error) {
                return (error as Error).message;
            }
        },
    );
}

export function 发枪(ctx: Context) {
    ctx.command("发枪 <编号:number> <数量:number>")
        .alias("发放步枪")
        .action(async ({ session }, 编号, 数量) => {
            try {
                if (!数量 || 数量 <= 0) {
                    return "发枪数量必须为正整数（回收请用：分配装备 编号 步兵装备 负数）";
                }
                const 结果 = await 玩家联军检查(ctx, session);
                const 军队 = await 军队解析(ctx, 编号);
                if (军队.所属联军编号 !== 结果.联军编号) {
                    return "只能操作本联军的军队";
                }

                const { 实际数量 } = await 分配装备工作流(ctx, 军队, 结果, "步兵装备", 数量);

                return `已向军队 #${军队.id} 发放步兵装备 ×${格式化(实际数量)}`;
            } catch (error) {
                return (error as Error).message;
            }
        });
}

export function 扩军(ctx: Context) {
    ctx.command("扩军 <编号:number> <人力:number>")
        .alias("分配人力")
        .action(async ({ session }, 编号, 人力) => {
            try {
                const 结果 = await 玩家联军检查(ctx, session);
                const 军队 = await 军队解析(ctx, 编号);
                if (军队.所属联军编号 !== 结果.联军编号) {
                    return "只能操作本联军的军队";
                }

                await 扩军工作流(ctx, 军队, 结果, 人力);
                return [
                    "====[扩军]====",
                    `军队 #${军队.id}（${军队.名称}）扩编 ${格式化(人力)} 人`,
                    `■ 现有兵力：${格式化(军队.士兵数量 + 人力)}`,
                    `■ 你的工人已同步扣减`,
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}

export function 裁军(ctx: Context) {
    ctx.command("裁军 <编号:number> <人力:number>").action(async ({ session }, 编号, 人力) => {
        try {
            const 结果 = await 玩家联军检查(ctx, session);
            const 军队 = await 军队解析(ctx, 编号);
            if (军队.所属联军编号 !== 结果.联军编号) {
                return "只能操作本联军的军队";
            }

            const { 实际裁减 } = await 裁军工作流(ctx, 军队, 结果, 人力);
            return [
                "====[裁军]====",
                `军队 #${军队.id}（${军队.名称}）裁减 ${格式化(实际裁减)} 人`,
                `■ 现有兵力：${格式化(军队.士兵数量 - 实际裁减)}`,
                `■ 士兵已转为你的工人`,
            ].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });
}
