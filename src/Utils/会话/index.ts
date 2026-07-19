import type { Session } from "koishi";
import type { 支持平台 } from "../types";

const 支持平台列表: 支持平台[] = ["onebot", "discord", "telegram"];

function 是否支持平台(platform: string | undefined): platform is 支持平台 {
    return (
        typeof platform === "string" &&
        支持平台列表.some((item) => item === platform)
    );
}

export function 会话检查(
    session: Session | undefined,
): asserts session is Session {
    if (!session) {
        throw new Error("无法获取会话信息");
    }
}

export function 用户检查(
    session: Session | undefined,
): asserts session is Session {
    会话检查(session);

    if (!是否支持平台(session.platform)) {
        throw new Error("无法获取平台信息/或平台不受支持");
    }

    if (!session.userId) {
        throw new Error("无法获取用户信息");
    }
}

export function 发送并抛出错误(
    session: Session,
    用户提示: string,
    错误信息 = 用户提示,
): never {
    void session.send(用户提示);
    throw new Error(错误信息);
}
