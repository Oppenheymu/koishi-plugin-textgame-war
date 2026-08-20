import dayjs from "dayjs";
import type { Context } from "koishi";
import {
    type 改名审核工单,
    改名工单池,
    type 改名类型,
    获取下一个工单编号,
    获取工单目标标识,
    获取待审核工单,
} from "#ctx/naming/domain/工单";
import { 审核群号 } from "#ctx/naming/infrastructure/审核群号";

async function 推送改名审核工单(ctx: Context, 工单: 改名审核工单): Promise<void> {
    const 推送文本 = [
        `【改名工单 #${工单.工单编号}】`,
        `类型：${工单.类型}`,
        `申请人：${工单.申请人名称}（UID:${工单.申请人UID}）`,
        获取工单目标标识(工单),
        `新名称：${工单.新名称}`,
        `创建时间：${工单.创建时间}`,
        "管理员回复本条消息并发送【审核通过】或【审核驳回】",
    ].join("\n");

    const onebotBot = Object.values(ctx.bots).find((bot) => bot.platform === "onebot");

    if (!onebotBot) return;

    try {
        await onebotBot.sendMessage(审核群号, 推送文本);
    } catch {}
}

export async function 创建改名审核工单(
    ctx: Context,
    payload: {
        类型: 改名类型;
        新名称: string;
        申请人ID: number;
        申请人UID: string;
        申请人名称: string;
        玩家ID?: number;
        联军编号?: string;
        地区编号?: string;
        军队编号?: number;
    },
): Promise<{
    工单编号: number;
}> {
    const 工单编号 = 获取下一个工单编号();
    const 工单: 改名审核工单 = {
        工单编号,
        状态: "待审核",
        创建时间: dayjs().format("YYYY-M-D-H"),
        ...payload,
    };

    改名工单池.set(工单编号, 工单);
    await 推送改名审核工单(ctx, 工单);

    return {
        工单编号,
    };
}

export async function 检查名称是否重复(
    ctx: Context,
    名称: string,
    options?: {
        排除玩家ID?: number;
        排除联军编号?: string;
    },
): Promise<"玩家" | "联军" | null> {
    const [重名玩家] = await ctx.database.get("征战玩家配置表", {
        username: 名称,
    });
    if (重名玩家 && 重名玩家.id !== options?.排除玩家ID) {
        return "玩家";
    }

    const [重名联军] = await ctx.database.get("征战联军表", {
        联军名称: 名称,
    });
    if (重名联军 && 重名联军.联军编号 !== options?.排除联军编号) {
        return "联军";
    }

    return null;
}

export async function 审核通过改名工单(ctx: Context, 工单编号: number): Promise<string> {
    const 工单 = 获取待审核工单(工单编号);

    if (工单.类型 !== "地区") {
        const 排除参数: {
            排除玩家ID?: number;
            排除联军编号?: string;
        } = {};
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
            "征战玩家配置表",
            {
                id: 工单.玩家ID,
            },
            {
                username: 工单.新名称,
                名称是否审核: true,
                上次改名日期: dayjs().format("YYYY-M-D-H"),
            },
        );
    } else if (工单.类型 === "联军") {
        if (!工单.联军编号) {
            throw new Error("工单数据异常：缺少联军编号");
        }

        await ctx.database.set(
            "征战联军表",
            {
                联军编号: 工单.联军编号,
            },
            {
                联军名称: 工单.新名称,
                名称是否审核: true,
                上次改名日期: dayjs().format("YYYY-M-D-H"),
            },
        );
    } else if (工单.类型 === "军队") {
        if (typeof 工单.军队编号 !== "number") {
            throw new Error("工单数据异常：缺少军队编号");
        }

        await ctx.database.set(
            "征战军队表",
            {
                id: 工单.军队编号,
            },
            {
                名称: 工单.新名称,
                名称是否审核: true,
            },
        );
    } else {
        if (!工单.地区编号) {
            throw new Error("工单数据异常：缺少地区编号");
        }

        await ctx.database.set(
            "征战地区配置表",
            {
                地区编号: 工单.地区编号,
            },
            {
                地区名称: 工单.新名称,
                名称是否审核: true,
                上次改名日期: dayjs().format("YYYY-M-D-H"),
            },
        );
    }

    工单.状态 = "已通过";
    return `改名工单 #${工单编号} 已通过`;
}

export function 审核驳回改名工单(工单编号: number, 原因?: string): string {
    const 工单 = 获取待审核工单(工单编号);
    工单.状态 = "已驳回";

    const 规范原因 = 原因?.trim();
    if (规范原因) {
        工单.驳回原因 = 规范原因;
    } else {
        delete 工单.驳回原因;
    }

    return 工单.驳回原因
        ? `改名工单 #${工单编号} 已驳回，原因：${工单.驳回原因}`
        : `改名工单 #${工单编号} 已驳回`;
}
