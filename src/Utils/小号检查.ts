
import { Context, Session } from 'koishi';
import type { OneBotBot } from 'koishi-plugin-adapter-onebot';
import { 会话检查 } from './用户检查';



interface NapcatResponse {
    user_id: number,
    uid: string,
    uin: string,
    nickname: string,
    age: number,
    qid: string,
    qqLevel: number,
    sex: string,
    long_nick: string,
    reg_time: number,
    is_vip: boolean,
    is_years_vip: boolean,
    vip_level: number,
    remark: string,
    status: number,
    login_days: number
}

interface 小号检查配置 {
    discord最小账号天数?: number,
    qq最小等级?: number
}

const 默认小号检查配置: Required<小号检查配置> = {
    discord最小账号天数: 30,
    qq最小等级: 16,
};

export async function discord创建时间获取(session: Session, ctx: Context): Promise<Date | null> {
    const createdAtRaw = (session as any)?.event?.user?.createdAt ?? (session as any)?.author?.createdAt;

    if (!createdAtRaw) {
        ctx.logger.warn('无法获取 Discord 用户创建时间');
        return null;
    }

    const createdAt = createdAtRaw instanceof Date ? createdAtRaw : new Date(createdAtRaw);
    if (Number.isNaN(createdAt.getTime())) {
        ctx.logger.warn(`Discord 用户创建时间无效: ${String(createdAtRaw)}`);
        return null;
    }

    return createdAt;
}

export async function qq等级获取(userId: string, session: Session, ctx: Context): Promise<number> {
    const numericUserId = Number(userId);
    if (Number.isNaN(numericUserId)) {
        ctx.logger.warn(`无效的用户ID格式: ${userId}`);
        return -1;
    }

    try {
        const bot = session.bot as OneBotBot<Context>;
        const response = await bot.internal.getStrangerInfo(numericUserId) as NapcatResponse;

        if (!response) {
            ctx.logger.warn('获取用户等级失败');
            return -1;
        }

        return response.qqLevel;
    } catch (error) {
        ctx.logger.error('获取用户等级时发生异常', error);
        return -1;
    }
}

export async function 是否为小号(
    session: Session | undefined,
    ctx: Context,
    配置?: 小号检查配置,
): Promise<boolean> {

    会话检查(session);

    const { platform, userId } = session;
    const 最终配置 = { ...默认小号检查配置, ...配置 };

    if (platform === 'discord') {
        const createdAt = await discord创建时间获取(session, ctx);
        if (!createdAt) return false;

        const 账号年龄天数 = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return 账号年龄天数 < 最终配置.discord最小账号天数;
    }

    if (platform === 'onebot') {
        if (!userId) return false;

        const 等级 = await qq等级获取(userId, session, ctx);
        if (等级 < 0) return false;

        return 等级 < 最终配置.qq最小等级;
    }

    return false;
}

