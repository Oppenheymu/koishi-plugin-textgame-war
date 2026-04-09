import { Session } from "koishi";

export function 发送并抛出错误(
    session: Session,
    用户提示: string,
    错误信息 = 用户提示,
): never {
    void session.send(用户提示);
    throw new Error(错误信息);
}
