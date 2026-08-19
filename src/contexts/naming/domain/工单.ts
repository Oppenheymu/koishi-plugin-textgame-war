import { 检查违禁词 } from "#shared/profanity";

export type 改名类型 = "玩家" | "联军" | "地区" | "军队";

export type 工单状态 = "待审核" | "已通过" | "已驳回";

export interface 改名审核工单 {
    工单编号: number;
    类型: 改名类型;
    新名称: string;
    申请人ID: number;
    申请人UID: string;
    申请人名称: string;
    玩家ID?: number;
    联军编号?: string;
    地区编号?: string;
    军队编号?: number;
    状态: 工单状态;
    创建时间: string;
    驳回原因?: string;
}

const 改名工单池 = new Map<number, 改名审核工单>();
let 工单自增ID = 1;

function 获取下一个工单编号(): number {
    return 工单自增ID++;
}

export function 获取待审核工单(工单编号: number): 改名审核工单 {
    const 工单 = 改名工单池.get(工单编号);
    if (!工单) {
        throw new Error(`未找到改名工单 #${工单编号}`);
    }
    if (工单.状态 !== "待审核") {
        throw new Error(`改名工单 #${工单编号} 已处理（${工单.状态}）`);
    }
    return 工单;
}

export function 获取工单目标标识(工单: 改名审核工单): string {
    if (工单.类型 === "联军") {
        return `联军编号：${工单.联军编号}`;
    }

    if (工单.类型 === "地区") {
        return `地区编号：${工单.地区编号}`;
    }

    if (工单.类型 === "军队") {
        return `军队编号：${工单.军队编号}`;
    }

    return `玩家ID：${工单.玩家ID}`;
}

export { 改名工单池, 获取下一个工单编号 };

function 解析改名时间戳(上次改名日期: string | null | undefined): number | null {
    const 文本 = 上次改名日期?.trim();
    if (!文本) return null;

    const 格式匹配 = 文本.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{1,2})$/);
    if (格式匹配) {
        const [, 年, 月, 日, 时] = 格式匹配;
        const 时间戳 = new Date(Number(年), Number(月) - 1, Number(日), Number(时)).getTime();
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

export function 解析引用工单编号(引用文本: string | undefined): number | null {
    const 编号文本 = 引用文本?.match(/改名工单\s*#(\d+)/)?.[1];
    if (!编号文本) return null;

    const 编号 = Number(编号文本);
    if (!Number.isInteger(编号) || 编号 <= 0) return null;

    return 编号;
}

export function 校验名称文本(新名称: string, 名称类型: 改名类型): string | null {
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
