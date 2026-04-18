import type { Context } from 'koishi';
import { 是否豁免扩军计划限制, 玩家联军权限设置 } from '@/logic';
import { 更新玩家资料, 玩家联军检查, 生成随机图片片段 } from '@/utils';

const 图片概率 = 0.01;
const 图片池 = ['行军.jpg', '行军2.jpg', '行军3.jpg', '阅兵2.jpg'];

export function 扩军(ctx: Context) {
    ctx.command('扩军 <数量:number>')
        .alias('国家扩军')
        .alias('联军扩军')
        .action(async ({ session }, 数量) => {
            try {
                const 权限等级需求 = await 玩家联军权限设置(
                    ctx,
                    session,
                    '设置扩军计划'
                );
                const {
                    uid,
                    id,
                    username,
                    用户资料,
                    联军资料,
                    联军编号,
                    权限等级,
                } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 权限等级需求,
                    是否必须在成员列表: true,
                });
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                if (!数量) {
                    return `
【红色战争】
${username}同志：
■格式：扩军 <数量>
■作用：消耗工人，按1:1扩充到联军军队`.trim();
                }

                if (!Number.isInteger(数量) || 数量 <= 0) {
                    return '请输入正确的扩军数量';
                }

                const 扩军计划上限 = 联军资料.扩军计划;
                const 当天已扩军 = 联军资料.当天扩军累计 ?? 0;
                const 是否豁免限制 = 是否豁免扩军计划限制(
                    联军资料,
                    uid,
                    权限等级
                );
                if (
                    !是否豁免限制 &&
                    typeof 扩军计划上限 === 'number' &&
                    扩军计划上限 > 0
                ) {
                    const 当天剩余额度 = 扩军计划上限 - 当天已扩军;
                    if (当天剩余额度 <= 0) {
                        return `今日扩军计划额度已用尽（上限 ${格式化(扩军计划上限)}）`;
                    }
                    if (数量 > 当天剩余额度) {
                        return `今日剩余可扩军 ${格式化(当天剩余额度)}，请调整扩军数量`;
                    }
                }

                if (用户资料.工人 < 数量) {
                    return '工人不足，无法扩军';
                }
                if (用户资料.步兵装备 < 数量) {
                    return '步兵装备不足，无法扩军';
                }

                const 新工人 = 用户资料.工人 - 数量;
                const 新步兵装备 = 用户资料.步兵装备 - 数量;
                const 新联军军队 = 联军资料.联军军队 + 数量;

                const 旧联军贡献 = 联军资料.联军成员列表[uid].联军贡献;
                const 新联军贡献 = 旧联军贡献 + 数量 * 10;
                const 新联军成员列表 = {
                    ...联军资料.联军成员列表,
                    [uid]: {
                        ...联军资料.联军成员列表[uid],
                        联军贡献: 新联军贡献,
                    },
                };

                await Promise.all([
                    更新玩家资料(ctx, id, {
                        工人: 新工人,
                        步兵装备: 新步兵装备,
                    }),
                    ctx.database.set(
                        '马列联军表',
                        {
                            联军编号,
                        },
                        {
                            联军军队: 新联军军队,
                            联军成员列表: 新联军成员列表,
                            当天扩军累计: 当天已扩军 + 数量,
                        }
                    ),
                ]);

                const 图片片段 = 生成随机图片片段(图片池, 图片概率);

                const 文本消息 = `
====[红色战争]====
${username} 同志：
扩军完成！
■ 联军军队：${格式化(新联军军队)}(+${格式化(数量)})
■ 工人：${格式化(新工人)}(-${格式化(数量)})
■ 步兵装备：${格式化(新步兵装备)}(-${格式化(数量)})
■ 贡献: ${格式化(新联军贡献)}(+${格式化(数量 * 10)})
`.trim();

                return 图片片段 ? `${文本消息}\n${图片片段}` : 文本消息;
            } catch (error) {
                return (error as Error).message;
            }
        });
}
