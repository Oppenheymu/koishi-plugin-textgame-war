import type { Session } from 'koishi';

export function 会话检查(session: Session | undefined): asserts session is Session {
    if (!session) {
        throw new Error('无法获取会话信息');
    }
}
