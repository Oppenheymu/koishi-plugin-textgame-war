import { Session } from "koishi";
import { 会话检查 } from "./用户会话检查";

export function 用户检查(session: Session | undefined): {
    platform: string;
    userId: string;
} {
    会话检查(session);

    const validPlatforms: string[] = ["onebot", "discord", "telegram"];

    if (!session.platform || !validPlatforms.includes(session.platform)) {
        throw new Error("无法获取平台信息/或平台不受支持");
    }

    if (!session.userId) {
        throw new Error("无法获取用户信息");
    }

    return {
        platform: session.platform,
        userId: session.userId,
    };
}
