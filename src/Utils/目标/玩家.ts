import type { Context, Session } from 'koishi';
import type { Player, PlayerWarData } from '@/types';
import { 会话检查 } from '../会话';
import { 合并玩家资料 } from '../玩家/查询';

export async function 目标解析(
    ctx: Context,
    session: Session | undefined,
    目标: string
): Promise<{
    目标用户ID: number;
    目标用户名: string;
    目标用户资料: Player & PlayerWarData;
}> {
    会话检查(session);

    async function 获取目标配置(config: {
        id: number;
        username: string;
    }): Promise<{
        目标用户ID: number;
        目标用户名: string;
        目标用户资料: Player & PlayerWarData;
    }> {
        const [[目标用户资料], [目标用户战争资料]] = await Promise.all([
            ctx.database.get('马列玩家表', { id: config.id }),
            ctx.database.get('马列玩家战争表', { id: config.id }),
        ]);

        if (!目标用户资料)
            throw new Error(
                `数据异常：目标用户配置存在但玩家档案丢失，请联系管理员`
            );

        if (!目标用户战争资料)
            throw new Error(
                `数据异常：目标用户配置存在但玩家战争档案丢失，请联系管理员`
            );

        return {
            目标用户ID: config.id,
            目标用户名: config.username,
            目标用户资料: 合并玩家资料(目标用户资料, 目标用户战争资料),
        };
    }

    const platform = session.platform;

    const atElement = session.elements?.find(
        (el) => el.type === 'at' && el.attrs?.id
    );
    if (atElement?.attrs?.id) {
        const 目标用户ID = atElement.attrs.id;
        const [config] = await ctx.database.get('马列玩家配置表', {
            [platform]: 目标用户ID,
        });
        if (!config)
            throw new Error(
                `目标用户尚未注册（${platform}:${目标用户ID}），请让对方先发送[注册]指令`
            );
        return 获取目标配置(config);
    }

    const 输入 = 目标?.trim();
    if (!输入) {
        throw new Error(
            '请指定目标用户：可以 @对方 或 直接输入对方 UID / QQ号'
        );
    }

    let [config] = await ctx.database.get('马列玩家配置表', { uid: 输入 });
    if (config) return 获取目标配置(config);

    [config] = await ctx.database.get('马列玩家配置表', {
        [platform]: 输入,
    });
    if (config) return 获取目标配置(config);

    throw new Error('目标用户尚未注册');
}
