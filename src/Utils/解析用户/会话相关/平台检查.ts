import type { Session } from 'koishi';
import type { 支持平台 } from '../types';
import { 会话检查 } from './会话检查';

const 支持平台列表: 支持平台[] = ['onebot', 'discord', 'telegram'];

function 是否支持平台(platform: string | undefined): platform is 支持平台 {
    return (
        typeof platform === 'string' &&
        支持平台列表.some((item) => item === platform)
    );
}

export function 用户检查(
    session: Session | undefined
): asserts session is Session {
    会话检查(session);

    if (!是否支持平台(session.platform)) {
        throw new Error('无法获取平台信息/或平台不受支持');
    }

    if (!session.userId) {
        throw new Error('无法获取用户信息');
    }
}
