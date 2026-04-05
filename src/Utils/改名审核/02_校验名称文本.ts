import { 检查违禁词 } from "../违禁检查";
import { 改名类型 } from "./types";

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
