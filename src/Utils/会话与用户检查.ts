import { Session } from 'koishi';



export function requireSession(session: Session | undefined): asserts session is Session {
  if (!session) {
    throw new Error('无法获取会话信息');
  }
}

export function requireUser(session: Session): { userId: string; username: string } {
  
  requireSession(session);

  if (!session.userId || !session.author) {
    throw new Error('无法获取用户信息');
  }
  
  return {
    userId: session.userId,
    username: session.author.name || '未知用户',
  };
}
