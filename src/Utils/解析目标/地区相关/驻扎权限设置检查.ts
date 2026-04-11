import {
    Context,
    Session
} from "koishi";
import {
    玩家检查,
    玩家联军检查,
    玩家联军权限设置,
} from "@/utils";
import {
    地区解析,
    当前地区解析,
    type 地区解析结果
} from "./获取数据";

export interface 驻扎权限设置检查结果 extends 地区解析结果 {
    username: string;
    是否地区总督: boolean;
    是否地区司令: boolean;
}

export async function 驻扎权限设置检查(
    ctx: Context,
    session: Session | undefined,
    地区编号参数?: string
): Promise<驻扎权限设置检查结果> {
    const {
        username,
    } = await 玩家检查(ctx, session);

    const 规范地区编号 = 地区编号参数?.trim();
    const 地区结果 = 规范地区编号
        ? await 地区解析(ctx, 规范地区编号, session)
        : await 当前地区解析(ctx, session);

    const 是否地区总督 =
        (地区结果.地区资料.地区总督 ?? "").trim() === username.trim();
    const 是否地区司令 =
        (地区结果.地区战略资料.地区司令 ?? "").trim() === username.trim();

    if (是否地区总督 || 是否地区司令) {
        return {
            ...地区结果,
            username,
            是否地区总督,
            是否地区司令,
        };
    }

    const 权限等级需求 = await 玩家联军权限设置(
        ctx,
        session,
        "设置地区驻扎权限"
    );

    const {
        联军编号,
    } = await 玩家联军检查(ctx, session, {
        最低权限等级: 权限等级需求,
        是否必须在成员列表: true,
    });

    const 控制国家 = 地区结果.地区资料.控制国家?.trim();
    if (!控制国家) {
        throw new Error("该地区暂无控制国家，仅地区总督/司令可设置驻扎权限");
    }

    if (联军编号 !== 控制国家) {
        throw new Error("只有地区控制国的有权限成员，或地区总督/司令可设置驻扎权限");
    }

    return {
        ...地区结果,
        username,
        是否地区总督,
        是否地区司令,
    };
}
