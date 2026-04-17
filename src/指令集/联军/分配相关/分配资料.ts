import type { Context } from 'koishi';
import { 尝试发送联军信号塔通报, 玩家联军权限设置 } from '@/logic';
import { 更新玩家资料, 玩家联军检查, 目标解析 } from '@/utils';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');

export function 分配生活资料(ctx: Context) {
    ctx.command('分配生活资料 <数量:number> [目标:string]')
        .alias('联军分配生活资料')
        .alias('配给资料')
        .alias('分配资料')
        .alias('分配资本')
        .action(async ({ session }, 数量, 目标) => {
            try {
                if (!Number.isInteger(数量) || 数量 <= 0) {
                    throw new Error('分配数量必须是正整数');
                }

                const 权限等级需求 = await 玩家联军权限设置(
                    ctx,
                    session,
                    '分配生活资料'
                );
                const { id, uid, username, 用户资料, 联军编号, 联军资料 } =
                    await 玩家联军检查(ctx, session, {
                        最低权限等级: 权限等级需求,
                        是否必须在成员列表: true,
                    });

                let 接收者ID = id;
                let 接收者UID = uid;
                let 接收者显示名 = username;
                let 接收者当前生活资料 = 用户资料.生活资料 ?? 0;

                const 输入目标 = 目标?.trim();
                if (输入目标) {
                    const { 目标用户ID, 目标用户名, 目标用户资料 } =
                        await 目标解析(ctx, session, 输入目标);

                    if (目标用户资料.所在联军 !== 联军编号) {
                        throw new Error('目标不在你的联军中，无法分配联军储备');
                    }

                    const [目标配置] = await ctx.database.get(
                        '马列玩家配置表',
                        {
                            id: 目标用户ID,
                        }
                    );

                    接收者ID = 目标用户ID;
                    接收者UID = 目标配置?.uid ?? 目标用户名;
                    接收者显示名 = 目标用户名;
                    接收者当前生活资料 = 目标用户资料.生活资料 ?? 0;
                }

                if ((联军资料.联军生活资料 ?? 0) < 数量) {
                    throw new Error(
                        `联军生活资料不足：当前 ${格式化(联军资料.联军生活资料 ?? 0)}，需求 ${格式化(数量)}`
                    );
                }

                await 更新玩家资料(ctx, 接收者ID, {
                    生活资料: 接收者当前生活资料 + 数量,
                });

                const 旧记录 = 联军资料.生活资料分配记录 ?? [];
                const 新记录 = [
                    {
                        分配者: uid,
                        接收方: 接收者UID,
                        数量,
                        时间: new Date().toLocaleString('zh-CN', {
                            hour12: false,
                        }),
                    },
                    ...旧记录,
                ].slice(0, 100);

                await ctx.database.set(
                    '马列联军表',
                    { 联军编号 },
                    {
                        联军生活资料: (联军资料.联军生活资料 ?? 0) - 数量,
                        生活资料分配记录: 新记录,
                    }
                );

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号,
                    通报标题: '联军后勤通报',
                    通报内容: `${username} 向 ${接收者显示名} 分配了 ${格式化(数量)} 生活资料`,
                });

                return `
====[征战文游]====
${username} 同志：
已向 ${接收者显示名} 分配联军资料 ${格式化(数量)}
联军剩余资料：${格式化((联军资料.联军生活资料 ?? 0) - 数量)}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
