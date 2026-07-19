import dayjs from "dayjs";
import type { Context } from "koishi";

import { 检查违禁词 } from "../违禁检查";
import { 审核群号 } from "./state";

type 改名类型 = "玩家" | "联军" | "地区";

type 工单状态 = "待审核" | "已通过" | "已驳回";

interface 改名审核工单 {
    工单编号: number;
    类型: 改名类型;
    新名称: string;
    申请人ID: number;
    申请人UID: string;
    申请人名称: string;
    玩家ID?: number;
    联军编号?: string;
    地区编号?: string;
    状态: 工单状态;
    创建时间: string;
    驳回原因?: string;
}

export const 改名工单池 = new Map<number, 改名审核工单>();
let 工单自增ID = 1;

function 获取待审核工单(工单编号: number): 改名审核工单 {
    const 工单 = 改名工单池.get(工单编号);
    if (!工单) {
        throw new Error(`未找到改名工单 #${工单编号}`);
    }
    if (工单.状态 !== "待审核") {
        throw new Error(`改名工单 #${工单编号} 已处理（${工单.状态}）`);
    }
    return 工单;
}

function 获取工单目标标识(工单: 改名审核工单): string {
    if (工单.类型 === "联军") {
        return `联军编号：${工单.联军编号}`;
    }

    if (工单.类型 === "地区") {
        return `地区编号：${工单.地区编号}`;
    }

    return `玩家ID：${工单.玩家ID}`;
}

async function 推送改名审核工单(
    ctx: Context,
    工单: 改名审核工单,
): Promise<void> {
    const 推送文本 = [
        `【改名工单 #${工单.工单编号}】`,
        `类型：${工单.类型}`,
        `申请人：${工单.申请人名称}（UID:${工单.申请人UID}）`,
        获取工单目标标识(工单),
        `新名称：${工单.新名称}`,
        `创建时间：${工单.创建时间}`,
        "管理员回复本条消息并发送【审核通过】或【审核驳回】",
    ].join("\n");

    const onebotBot = Object.values(ctx.bots).find(
        (bot) => bot.platform === "onebot",
    );

    if (!onebotBot) return;

    try {
        await onebotBot.sendMessage(审核群号, 推送文本);
    } catch {}
}

export function 解析改名时间戳(
    上次改名日期: string | null | undefined,
): number | null {
    const 文本 = 上次改名日期?.trim();
    if (!文本) return null;

    const 格式匹配 = 文本.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{1,2})$/);
    if (格式匹配) {
        const [, 年, 月, 日, 时] = 格式匹配;
        const 时间戳 = new Date(
            Number(年),
            Number(月) - 1,
            Number(日),
            Number(时),
        ).getTime();
        return Number.isNaN(时间戳) ? null : 时间戳;
    }

    const 回退时间戳 = Date.parse(文本);
    return Number.isNaN(回退时间戳) ? null : 回退时间戳;
}

export function 检查改名冷却(
    上次改名日期: string | null | undefined,
    名称类型: 改名类型,
): string | null {
    const 上次改名时间戳 = 解析改名时间戳(上次改名日期);
    if (!上次改名时间戳) return null;

    const 冷却毫秒 = 7 * 24 * 60 * 60 * 1000;
    const 剩余毫秒 = 冷却毫秒 - (Date.now() - 上次改名时间戳);
    if (剩余毫秒 <= 0) return null;

    const 剩余小时 = Math.ceil(剩余毫秒 / (60 * 60 * 1000));
    const 剩余天数 = Math.floor(剩余小时 / 24);
    const 额外小时 = 剩余小时 % 24;

    return 剩余天数 > 0
        ? `${名称类型}名称每周仅可修改一次，请${剩余天数}天${额外小时}小时后再试`
        : `${名称类型}名称每周仅可修改一次，请${额外小时}小时后再试`;
}

function 获取下一个工单编号(): number {
    return 工单自增ID++;
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

export function 解析引用工单编号(引用文本: string | undefined): number | null {
    const 编号文本 = 引用文本?.match(/改名工单\s*#(\d+)/)?.[1];
    if (!编号文本) return null;

    const 编号 = Number(编号文本);
    if (!Number.isInteger(编号) || 编号 <= 0) return null;

    return 编号;
}

export function 校验名称文本(
    新名称: string,
    名称类型: 改名类型,
): string | null {
    const 规范名称 = 新名称.trim();

    if (!规范名称) return `请提供${名称类型}名称`;

    if (规范名称.length < 2 || 规范名称.length > 12) {
        return `${名称类型}名称须在2到12字符间`;
    }

    const 合法字符 = /^[\u4e00-\u9fa5]+$/;
    if (!合法字符.test(规范名称)) {
        return `${名称类型}名称只能包含中文`;
    }

    const 命中违禁词 = 检查违禁词(规范名称);
    if (命中违禁词) {
        return `${名称类型}名称包含不允许的词语`;
    }

    return null;
}

export async function 检查名称是否重复(
    ctx: Context,
    名称: string,
    options?: {
        排除玩家ID?: number;
        排除联军编号?: string;
    },
): Promise<"玩家" | "联军" | null> {
    const [重名玩家] = await ctx.database.get("马列玩家配置表", {
        username: 名称,
    });
    if (重名玩家 && 重名玩家.id !== options?.排除玩家ID) {
        return "玩家";
    }

    const [重名联军] = await ctx.database.get("马列联军表", {
        联军名称: 名称,
    });
    if (重名联军 && 重名联军.联军编号 !== options?.排除联军编号) {
        return "联军";
    }

    return null;
}

export async function 审核通过改名工单(
    ctx: Context,
    工单编号: number,
): Promise<string> {
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
            "马列玩家配置表",
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
            "马列联军表",
            {
                联军编号: 工单.联军编号,
            },
            {
                联军名称: 工单.新名称,
                名称是否审核: true,
                上次改名日期: dayjs().format("YYYY-M-D-H"),
            },
        );
    } else {
        if (!工单.地区编号) {
            throw new Error("工单数据异常：缺少地区编号");
        }

        await ctx.database.set(
            "马列地区配置表",
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
