import type { Context, Session } from "koishi";
import { 会话检查 } from "#shared/session";

/**
 * 用户可见文案错误：携带 i18n 键与参数，
 * 由指令 action 的 catch 经 指令错误转文本 统一渲染。
 */
export class 文案错误 extends Error {
    constructor(
        public readonly 键: string,
        public readonly 参数: object = {},
    ) {
        super(键);
        this.name = "文案错误";
    }
}

/** 共用文案（回复横幅），随指令集装配注册一次 */
export function 注册共用文案(ctx: Context) {
    ctx.i18n.define("zh-CN", "textwar", {
        banner: "====[征战文游]====",
    });
}

/** 标准回复格式：横幅 + 正文（正文由 i18n 键渲染） */
export function 带横幅回复(session: Session | undefined, 键: string, 参数?: object): string {
    会话检查(session);
    return `${session.text("textwar.banner")}\n${session.text(键, 参数)}`;
}

/** 指令 catch 统一出口：文案错误走 i18n 渲染，其余错误原样返回 message */
export function 指令错误转文本(session: Session | undefined, error: unknown): string {
    if (error instanceof 文案错误 && session) {
        return session.text(error.键, error.参数);
    }
    return (error as Error).message;
}
