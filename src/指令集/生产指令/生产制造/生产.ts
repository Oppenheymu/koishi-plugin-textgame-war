import { Context } from 'koishi';
import { 尝试发送随机图片, 玩家检查 } from "../../../Utils/index";

const 生产成功图片概率 = 0.01;
const 生产成功图片池 = [
    '工厂.jpg',
    '工厂2.jpg',
    '工厂3.jpg',
    '工厂4.jpeg',
    '工厂5.jpg',
    '建设.jpg',
    '建设2.jpg',
    '建设3.jpg',
];

export function 生产(ctx: Context) {
    ctx.command('生产')
        .action(async ({ session }) => {
            try {

                const { id, username, 用户资料} = await 玩家检查(ctx, session);

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

                const 原稳定度 = 用户资料.稳定度;
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

                await ctx.database.set('malieplayer', { id: id }, {
                    小时是否生产: true,
                    生活资料: 新生活资料,
                    稳定度: 新稳定度,
                    生产次数: 新生产次数
                });

                // 更新今日全球生产总值
                const globalData = await ctx.database.get('malieglobaldata', { id: 'global' });
                const currentTotal = globalData.length > 0 ? globalData[0]!.今日全球生产总值 : 0;
                
                if (globalData.length === 0) {
                    await ctx.database.create('malieglobaldata', { 
                        id: 'global', 
                        今日全球生产总值: 总产出 
                    });
                } else {
                    await ctx.database.set('malieglobaldata', { id: 'global' }, { 
                        今日全球生产总值: currentTotal + 总产出 
                    });
                }

                await 尝试发送随机图片(session, 生产成功图片池, 生产成功图片概率);

                return `
【工业生产】
${username} 同志：
===成功进行生产===
■ 工人：${格式化(用户资料.工人)}
■ 总产出：${格式化(总产出)}
■ 总盈利：${格式化(利润)}
■ 稳定度：${格式化(原稳定度)} → ${格式化(新稳定度)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
