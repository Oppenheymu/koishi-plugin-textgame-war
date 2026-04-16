import type { Context } from 'koishi';
import { 尝试发送联军信号塔通报, 玩家联军权限设置 } from '@/logic';
import { 更新玩家资料, 玩家联军检查 } from '@/utils';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');
const 贡献倍率 = 10;

export function 转入联军(ctx: Context) {
    ctx.command('转入联军 <数量:number>')
        .alias('转入军队')
        .alias('上缴军队')
        .action(async ({ session }, 数量) => {
            try {
                if (!Number.isInteger(数量) || 数量 <= 0) {
                    throw new Error('转入数量必须是正整数');
                }

                const 权限等级需求 = await 玩家联军权限设置(ctx, session, '转入联军');
                const { id, uid, username, 用户资料, 联军编号, 联军资料 } = await 玩家联军检查(
                    ctx,
                    session,
                    {
                        最低权限等级: 权限等级需求,
                        是否必须在成员列表: true,
                    }
                );

                if ((用户资料.私人军队 ?? 0) < 数量) {
                    throw new Error(
                        `私人军队不足：当前 ${格式化(用户资料.私人军队 ?? 0)}，需求 ${格式化(数量)}`
                    );
                }

                const 扩军计划上限 = 联军资料.扩军计划;
                if (typeof 扩军计划上限 === 'number' && 扩军计划上限 > 0 && 数量 > 扩军计划上限) {
                    throw new Error(
                        `当前联军扩军计划上限为 ${格式化(扩军计划上限)}，本次最多转入 ${格式化(扩军计划上限)}`
                    );
                }

                const 旧贡献 = 联军资料.联军成员列表?.[uid]?.联军贡献 ?? 0;
                const 新贡献 = 旧贡献 + 数量 * 贡献倍率;
                const 新联军成员列表 = {
                    ...(联军资料.联军成员列表 ?? {}),
                    [uid]: {
                        ...(联军资料.联军成员列表?.[uid] ?? {
                            联军贡献: 0,
                            加入时间: new Date().toLocaleString('zh-CN', { hour12: false }),
                        }),
                        联军贡献: 新贡献,
                    },
                };

                await Promise.all([
                    更新玩家资料(ctx, id, {
                        私人军队: (用户资料.私人军队 ?? 0) - 数量,
                    }),
                    ctx.database.set(
                        '马列联军表',
                        { 联军编号 },
                        {
                            联军军队: (联军资料.联军军队 ?? 0) + 数量,
                            联军成员列表: 新联军成员列表,
                        }
                    ),
                ]);

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号,
                    通报标题: '联军军务通报',
                    通报内容: `${username} 向联军转入了 ${格式化(数量)} 军队`,
                });

                return `
====[征战文游]====
${username} 同志：
已成功转入联军军队 ${格式化(数量)}
■ 联军军队：${格式化((联军资料.联军军队 ?? 0) + 数量)}
■ 私人军队：${格式化((用户资料.私人军队 ?? 0) - 数量)}
■ 联军贡献：${格式化(新贡献)}(+${格式化(数量 * 贡献倍率)})
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
