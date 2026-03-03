import { Context } from 'koishi';
import { requirePlayer } from "../../Utils/index";

export function 工人休假(ctx: Context) {
    ctx.command('工人休假 <数量:number>')
        .action(async ({ session }, 数量) => {
            try {

                const { userId, username } = await requirePlayer(ctx, session);
                const 用户资料 = (await ctx.database.get('malieplayer', { userId }))[0]!;

                // 格式化数字显示
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                // 输入验证
                if (!数量 || 数量 <= 0) {
                    return `请输入要休假的工人数量\n例如：\`工人休假 1000\``;
                }

                if (数量 > 用户资料.工人) {
                    return `工人不足！当前工人：${格式化(用户资料.工人)}，无法休假${格式化(数量)}个工人`;
                }
                
                // 计算休假后的数据
                const 新工人数 = 用户资料.工人 - 数量;
                const 新休假工人数 = 用户资料.休假工人 + 数量;
                const 总工人数 = 新工人数 + 用户资料.地下工人 + 新休假工人数;

                // 计算稳定度提升
                // 比值 = 休假工人 / 总工人
                const 休假比值 = 总工人数 > 0 ? (新休假工人数 / 总工人数) * 100 : 0;
                const 稳定度提升 = Math.floor(休假比值 * 10) / 100;
                const 新稳定度 = 用户资料.稳定度 + 稳定度提升;

                // 更新数据库
                await ctx.database.set('malieplayer', { userId: userId }, {
                    工人: 新工人数,
                    休假工人: 新休假工人数,
                    稳定度: 新稳定度
                });
                
                return `
====[征战文游]====
${username} 同志：
■ 工人：${格式化(用户资料.工人)} → ${格式化(新工人数)}
■ 休假工人：${格式化(用户资料.休假工人)} → ${格式化(新休假工人数)}
■ 稳定度：${用户资料.稳定度.toFixed(2)} → ${新稳定度.toFixed(2)}
□ 休假比值：${休假比值.toFixed(2)}%
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
