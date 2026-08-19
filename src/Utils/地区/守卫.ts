import type { Context, Session } from "koishi";
import { 玩家检查 } from "../玩家/守卫.js";
import { 地区解析, type 地区解析结果, 当前地区解析 } from "./查询.js";

export interface 驻扎检查结果 extends 地区解析结果 {
    id: number;
    uid: string;
    username: string;
    用户资料: Awaited<ReturnType<typeof 玩家检查>>["用户资料"];
    当前驻扎地区: string | null;
}

export async function 驻扎检查(
    ctx: Context,
    session: Session | undefined,
    地区编号参数?: string,
): Promise<驻扎检查结果> {
    const { id, uid, username, 用户资料 } = await 玩家检查(ctx, session);

    const 规范地区编号 = 地区编号参数?.trim();
    const 地区结果 = 规范地区编号
        ? await 地区解析(ctx, 规范地区编号, session)
        : ((await 当前地区解析(ctx, session)) as 地区解析结果);

    const 是否允许非联军成员驻扎 = 地区结果.地区资料.允许非联军成员驻扎 ?? true;
    const 地区控制国 = 地区结果.地区资料.控制国家?.trim();

    if (!是否允许非联军成员驻扎 && !用户资料.所在联军) {
        throw new Error("该地区当前不允许未加入联军的玩家驻扎");
    }

    if (地区控制国 && 用户资料.所在联军) {
        if (用户资料.所在联军 !== 地区控制国) {
            throw new Error(`你所在联军 ${用户资料.所在联军} 不是该地区的控制国家，无法驻扎此地区`);
        }
    }

    return {
        ...地区结果,
        id,
        uid,
        username,
        用户资料,
        当前驻扎地区: 用户资料.驻扎地区 ?? null,
    };
}
