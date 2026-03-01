import { Session, Context } from 'koishi';



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

export async function requirePlayer(ctx: Context, session: Session | undefined): Promise<{ userId: string; username: string }> {
  requireSession(session);
  const { userId, username } = requireUser(session);
  
  const userInfo = await ctx.database.get('malieplayer', { userId });
  
  if (!userInfo || userInfo.length === 0) {
    throw new Error(`${username} 同志，你还未签到过，请先发送[签到]指令进行注册`);
  }
  
  return { userId, username };
}

//一行搞定：会话检查 + 用户检查 + 玩家存在检查，太强啦
//const { userId, username } = await requirePlayer(ctx, session);
