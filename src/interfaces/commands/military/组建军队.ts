import type { Context } from "koishi";
import { 玩家联军检查, 获取联军操作权限 } from "#ctx/coalition";
import { 军队解析, 组建军队工作流, 解散军队工作流 } from "#ctx/military";

export function 组建军队(ctx: Context) {
    ctx.command("组建军队 [名称:text]")
        .alias("建立军队")
        .action(async ({ session }, 名称) => {
            try {
                const 结果 = await 玩家联军检查(ctx, session);
                const {
                    军队编号,
                    番号,
                    名称: 默认名称,
                    审核工单编号,
                } = await 组建军队工作流(ctx, 结果.联军资料, 结果, 名称);

                return [
                    "====[组建军队]====",
                    `${结果.username} 同志，军队组建成功！`,
                    `■ 军队编号：#${军队编号}`,
                    `■ 番号：第${番号}军`,
                    `■ 名称：${默认名称}`,
                    审核工单编号
                        ? `■ 自定义名称已提交审核（工单 #${审核工单编号}），审核通过后生效`
                        : "■ 可使用【军队命名 军队编号 名称】自定义名称",
                    "■ 下一步：扩军 <编号> <人力>、发枪 <编号> <数量>、分配装备 <编号> <装备> <数量>",
                ].join("\n");
            } catch (error) {
                return (error as Error).message;
            }
        });
}

export function 解散军队(ctx: Context) {
    ctx.command("解散军队 <编号:number>").action(async ({ session }, 编号) => {
        try {
            const 结果 = await 玩家联军检查(ctx, session);
            const 军队 = await 军队解析(ctx, 编号);

            // 指挥官本人 或 联军政治权限（分配军队）
            if (军队.指挥官UID !== 结果.uid) {
                const 所需等级 = await 获取联军操作权限(ctx, 结果.联军编号, "分配军队");
                if (结果.权限等级 < 所需等级) {
                    return `权限不足：只有指挥官本人或联军 ${所需等级} 级及以上权限才能解散军队`;
                }
            }

            await 解散军队工作流(ctx, 军队, 结果);
            return [
                "====[解散军队]====",
                `军队 #${军队.id}（${军队.名称}）已解散`,
                "■ 装备已返还库存，士兵已转为工人",
            ].join("\n");
        } catch (error) {
            return (error as Error).message;
        }
    });
}
