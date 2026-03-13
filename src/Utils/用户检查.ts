import { Session, Context } from 'koishi';
import { Player , PlayerConfig } from '../Types/index';



export function 会话检查(session: Session | undefined): asserts session is Session {
    if (!session) {
        throw new Error('无法获取会话信息');
    }
}

export function 用户检查( session: Session | undefined): { platform: string ; userId: string } {

    会话检查(session);

    const validPlatforms: string[] = ['onebot', 'discord', 'telegram'];

    if ( !session.platform || !validPlatforms.includes(session.platform) ) {
        throw new Error('无法获取平台信息/或平台不受支持');
    }

    if ( !session.userId ) {
        throw new Error('无法获取用户信息');
    }

    return {
        platform: session.platform,
        userId: session.userId,
    };
}

export async function 玩家检查(ctx: Context, session: Session | undefined ):
Promise<{
    id: number;
    uid: string;
    username: string;
    用户资料: Player;
    用户配置: PlayerConfig
}> {

    会话检查(session);

    const { platform , userId } = 用户检查(session);

    const [PlayerConfig] = await ctx.database.get('马列玩家配置表', { [platform]: userId } );
    if ( !PlayerConfig ) {
        session.send(`同志，你还未注册`);
        throw new Error('玩家未注册');
    }

    const [Player] = await ctx.database.get('马列玩家表', {id: PlayerConfig.id });
    if ( !Player ) {
        session.send(`数据异常：已找到账号但未发现玩家档案，请联系管理员`);
        throw new Error('玩家档案不存在');
    }

    return {
        id: PlayerConfig.id,
        uid: PlayerConfig.uid,
        username: PlayerConfig.username,
        用户资料: Player,
        用户配置: PlayerConfig
    };
}

//一行搞定：会话检查 + 用户检查 + 玩家存在检查，太强啦
//const { uid, username, 用户资料} = await 玩家检查(ctx, session);
