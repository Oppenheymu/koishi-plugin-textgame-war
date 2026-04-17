import type { Context, Session } from 'koishi';
import { 玩家检查 } from '../../解析用户/玩家相关/获取数据';
import { 地区解析, type 地区解析结果, 当前地区解析 } from './获取数据';

export interface 机场使用权限检查结果 extends 地区解析结果 {
    id: number;
    uid: string;
    username: string;
    当前驻扎地区: string | null;
    所在联军: string | null;
}

export interface 机场使用权限检查选项 {
    检查战机权限?: boolean;
}

export async function 机场使用权限检查(
    ctx: Context,
    session: Session | undefined,
    地区编号参数?: string,
    options?: 机场使用权限检查选项
): Promise<机场使用权限检查结果> {
    const { id, uid, username, 用户资料 } = await 玩家检查(ctx, session);

    const 规范地区编号 = 地区编号参数?.trim();
    const 地区结果 = 规范地区编号
        ? await 地区解析(ctx, 规范地区编号, session)
        : await 当前地区解析(ctx, session);

    const 是否允许非联军成员使用机场 =
        地区结果.地区资料.允许非联军成员使用机场 ?? true;

    if (!是否允许非联军成员使用机场 && !用户资料.所在联军) {
        throw new Error('该地区当前不允许未加入联军的玩家使用机场');
    }

    if (options?.检查战机权限) {
        const 是否允许机场使用战斗机 =
            地区结果.地区资料.允许机场使用战斗机 ?? true;
        if (!是否允许机场使用战斗机) {
            throw new Error('该地区当前禁止在机场使用战斗机');
        }
    }

    return {
        ...地区结果,
        id,
        uid,
        username,
        当前驻扎地区: 用户资料.驻扎地区 ?? null,
        所在联军: 用户资料.所在联军 ?? null,
    };
}
