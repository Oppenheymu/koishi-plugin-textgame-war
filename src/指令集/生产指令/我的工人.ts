import { Context } from 'koishi';
import { requirePlayer } from "../../Utils/index";



export function 我的工人(ctx: Context) {
    ctx.command('我的工人')
        .action(async ({ session }) => {
            try {
                const { userId, username } = await requirePlayer(ctx, session);
                const 用户资料 = (await ctx.database.get('malieplayer', { userId }))[0]!;

                const 地面工人 = 用户资料.工人;
                const 休假工人 = 用户资料.休假工人;
                const 劳动报酬 = 用户资料.生活资料;
                const 生产技术 = 用户资料.生产技术;
                const 生产力原始 = 地面工人 * 生产技术;
                const 生产力 = 生产力原始 >= 10000
                    ? `${(生产力原始 / 10000).toFixed(2)}万`
                    : `${生产力原始}`;
                // 厂房容量目前为固定值，可在未来根据玩家升级调整
                const 厂房容量 = 10000;

                return `
【情报查询】
==公开情报==
${username}
■ 地面工人：${地面工人}
■ 休假工人：${休假工人}
■ 劳动报酬：${劳动报酬}
■ 生产技术：${生产技术}
■ 生产力：${生产力}
■ 厂房容量：${厂房容量}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
