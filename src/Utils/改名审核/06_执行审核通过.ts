import dayjs from "dayjs";
import { Context } from "koishi";
import { 获取待审核工单 } from "./05_拉取待审工单";
import { 检查名称是否重复 } from "./03_校验名称重复";

export async function 审核通过改名工单(
    ctx: Context,
    工单编号: number
): Promise<string> {
    const 工单 = 获取待审核工单(工单编号);

    if (工单.类型 !== "地区") {
        const 排除参数: { 排除玩家ID?: number; 排除联军编号?: string } = {};
        if (typeof 工单.玩家ID === "number") {
            排除参数.排除玩家ID = 工单.玩家ID;
        }
        if (工单.联军编号) {
            排除参数.排除联军编号 = 工单.联军编号;
        }

        const 重名类型 = await 检查名称是否重复(ctx, 工单.新名称, 排除参数);
        if (重名类型) {
            throw new Error(`审核失败：该名称已被${重名类型}使用`);
        }
    }

    if (工单.类型 === "玩家") {
        if (typeof 工单.玩家ID !== "number") {
            throw new Error("工单数据异常：缺少玩家ID");
        }

        await ctx.database.set(
            "马列玩家配置表",
            { id: 工单.玩家ID },
            {
                username: 工单.新名称,
                名称是否审核: true,
                上次改名日期: dayjs().format("YYYY-M-D-H"),
            }
        );
    } else if (工单.类型 === "联军") {
        if (!工单.联军编号) {
            throw new Error("工单数据异常：缺少联军编号");
        }

        await ctx.database.set(
            "马列联军表",
            { 联军编号: 工单.联军编号 },
            {
                联军名称: 工单.新名称,
                名称是否审核: true,
                上次改名日期: dayjs().format("YYYY-M-D-H"),
            }
        );
    } else {
        if (!工单.地区编号) {
            throw new Error("工单数据异常：缺少地区编号");
        }

        await ctx.database.set(
            "马列地区配置表",
            { 地区编号: 工单.地区编号 },
            {
                地区名称: 工单.新名称,
                名称是否审核: true,
                上次改名日期: dayjs().format("YYYY-M-D-H"),
            }
        );
    }

    工单.状态 = "已通过";
    return `改名工单 #${工单编号} 已通过`;
}
