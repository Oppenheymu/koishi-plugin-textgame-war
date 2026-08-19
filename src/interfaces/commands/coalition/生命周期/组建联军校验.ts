import type { Context } from "koishi";
import { 检查名称是否重复 } from "#ctx/naming";
import type { 玩家完整资料 } from "#shared/kernel/跨域类型";
import { 检查违禁词 } from "#shared/profanity/检查违禁词";

export async function 校验小号身份(ctx: Context, session: unknown): Promise<string | null> {
    const amIAlt服务 = (
        ctx as Context & {
            amIAlt?: {
                isAlt: (session: unknown) => Promise<boolean>;
            };
        }
    ).amIAlt;

    if (amIAlt服务 && (await amIAlt服务.isAlt(session)) === true) {
        return "疑似小号禁止组建联军";
    }

    return null;
}

export function 校验名称非空(
    联军名称: string | undefined,
    username: string,
): { 规范联军名称: string } | string {
    const 规范联军名称 = 联军名称?.trim();
    if (!规范联军名称) {
        return `
=====[国家]=====
${username} 同志！
请提供国家名称。
如：组建国家 共和国
`.trim();
    }

    return { 规范联军名称 };
}

export async function 校验玩家可组建联军(
    ctx: Context,
    uid: string,
    username: string,
    用户资料: 玩家完整资料,
): Promise<string | null> {
    if (用户资料.所在联军) {
        return `
=====[国家]=====
${username} 同志！
你已加入联军（${用户资料.所在联军}），无法重复组建。
`.trim();
    }

    const [已创建联军] = await ctx.database.get(
        "马列联军表",
        {
            联军元首: uid,
        },
        ["联军编号", "联军名称"],
    );

    if (已创建联军) {
        return `
=====[国家]=====
${username} 同志！
你已组建过联军（${已创建联军.联军名称} / ${已创建联军.联军编号}）。
`.trim();
    }

    return null;
}

export async function 校验名称合规(
    ctx: Context,
    规范联军名称: string,
    username: string,
): Promise<string | null> {
    if (规范联军名称.length < 2 || 规范联军名称.length > 12) {
        return `
=====[国家]=====
${username} 同志！
国名须在2到12字符间
`.trim();
    }

    const 合法字符 = /^[\u4e00-\u9fa5]+$/;
    if (!合法字符.test(规范联军名称)) {
        return `
======[国家]=====
${username} 同志！
国家名称只能包含中文。
`.trim();
    }

    const 命中违禁词 = 检查违禁词(规范联军名称);
    if (命中违禁词) {
        return `国家名称包含不允许的词语`;
    }

    const 重名类型 = await 检查名称是否重复(ctx, 规范联军名称);
    if (重名类型) {
        return `
=====[国家]=====
${username} 同志！
该国家名称已被${重名类型}使用，请更换名称。
`.trim();
    }

    return null;
}
