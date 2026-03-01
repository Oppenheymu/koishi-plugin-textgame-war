import { Context } from 'koishi';
import { requirePlayer } from "../../Utils/index";



export function 我的全部资料(ctx: Context) {
    ctx.command('我的全部资料')
        .action(async ({ session }) => {
            try {
                const { userId, username } = await requirePlayer(ctx, session);
                const 用户资料 = (await ctx.database.get('malieplayer', { userId }))[0]!;
                return `
===[征战文游]===
${username} 同志：
■ 生活资料：${用户资料.生活资料}
■ 科技/生产技术：${用户资料.科技等级}/${用户资料.生产技术}
■ 工人/地下/休假：${用户资料.工人}/${用户资料.地下工人}/${用户资料.休假工人}
■ 私人军队：${用户资料.私人军队}
■ 石油：${用户资料.石油}
■ 飞机/隐飞/预警：${用户资料.飞机}/${用户资料.隐形飞机}/${用户资料.预警机}
■ 大运/小运/重炮：${用户资料.大型运输机}/${用户资料.小型运输机}/${用户资料.重炮}
■ 火箭炮/弹药/地下：${用户资料.火箭炮}/${用户资料.火箭炮弹药}/${用户资料.地下火箭炮炮弹}
■ 防空弹药/地下：${用户资料.防空弹药}/${用户资料.地下防空弹药}
□ 战斗机/巡航: ${用户资料.战斗机}/${用户资料.巡航中的战斗机}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}