import { Context } from 'koishi';
import { requirePlayer } from "../../Utils/index";

export function 生产(ctx: Context) {
    ctx.command('生产')
        .action(async ({ session }) => {
            try {

                const { userId, username } = await requirePlayer(ctx, session);
                const 用户资料 = (await ctx.database.get('malieplayer', { userId }))[0]!;
                
                // 格式化数字显示
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                // 检查生产次数
                if (用户资料.生产次数 <= 0) {
                    return `
【工业生产】
${username} 同志：
□ 生产次数不足
`.trim();
                }
                
                // 检查厂房空间
                if ( 用户资料.厂房 < 用户资料.工人 ) {
                    return `
【工业生产】
${username} 同志：
□ 厂房空间不够
□ 需求：${格式化(用户资料.工人)}/${格式化(用户资料.厂房)}
□ 命令：扩建厂房/领取厂房
□ 其他命令：工人休假/召回工人
`.trim();
                }


                // 计算最低工资
                const 最低工资 = Math.floor( 用户资料.生产技术 / 2 );
                const 当前工资 = 用户资料.工人工资;

                const 发出的工资 = 当前工资 * 用户资料.工人;
                
                let 新稳定度 = 用户资料.稳定度;

                // 如果当前工资小于最低工资，扣除稳定度
                if ( 当前工资 < 最低工资 ) {
                    const 扣除稳定度 = 最低工资 - 当前工资;
                    新稳定度 = Math.max( 0, 新稳定度 - 扣除稳定度 );
                }

                const 总产出 = 用户资料.生产技术 * 用户资料.工人;
                const 利润 = 总产出 - 发出的工资;

                const 新生活资料 = 用户资料.生活资料 + 利润;
                const 新生产次数 = 用户资料.生产次数 - 1;

                await ctx.database.set('malieplayer', { userId: userId }, {
                    小时是否生产: true,
                    生活资料: 新生活资料,
                    稳定度: 新稳定度,
                    生产次数: 新生产次数
                });

                return `
【工业生产】
${username} 同志：
===成功进行生产===
■ 工人：${格式化(用户资料.工人)}
■ 产出：${格式化(总产出)}
公式：${用户资料.生产技术}×${格式化(用户资料.工人)}
■ 工资：${格式化(发出的工资)}
■ 盈利：${格式化(利润)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
