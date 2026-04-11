import { 改名类型 } from "./types";
import { 解析改名时间戳 } from "./07_解析时间数据";

export function 检查改名冷却(
    上次改名日期: string | null | undefined,
    名称类型: 改名类型
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
