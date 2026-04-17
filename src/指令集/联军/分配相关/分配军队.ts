import type { Context } from 'koishi';
import { 尝试发送联军信号塔通报, 玩家联军权限设置 } from '@/logic';
import { 更新玩家资料, 玩家联军检查, 目标解析 } from '@/utils';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');

export function 分配军队(ctx: Context) {
    ctx.command('分配军队 <数量:number> [目标:string]')
        .alias('联军分配军队')
        .action(async ({ session }, 数量, 目标) => {
            try {
                if (!Number.isInteger(数量) || 数量 <= 0) {
                    throw new Error('分配数量必须是正整数');
                }

                const 权限等级需求 = await 玩家联军权限设置(
                    ctx,
                    session,
                    '分配军队'
                );
                const { id, uid, username, 用户资料, 联军编号, 联军资料 } =
                    await 玩家联军检查(ctx, session, {
                        最低权限等级: 权限等级需求,
                        是否必须在成员列表: true,
                    });

                let 接收者ID = id;
                let 接收者UID = uid;
                let 接收者显示名 = username;
                let 接收者当前私人军队 = 用户资料.私人军队 ?? 0;

                const 输入目标 = 目标?.trim();
                if (输入目标) {
                    const { 目标用户ID, 目标用户名, 目标用户资料 } =
                        await 目标解析(ctx, session, 输入目标);
                    if (目标用户资料.所在联军 !== 联军编号) {
                        throw new Error('目标不在你的联军中，无法分配联军军队');
                    }

                    接收者ID = 目标用户ID;
                    接收者UID = 目标用户资料.uid;
                    接收者显示名 = 目标用户名;
                    接收者当前私人军队 = 目标用户资料.私人军队 ?? 0;
                }

                if ((联军资料.联军军队 ?? 0) < 数量) {
                    throw new Error(
                        `联军军队不足：当前 ${格式化(联军资料.联军军队 ?? 0)}，需求 ${格式化(数量)}`
                    );
                }

                const 接收者成员数据 = 联军资料.联军成员列表?.[接收者UID];
                if (!接收者成员数据) {
                    throw new Error('目标不是联军有效成员，无法分配军队');
                }

                const 当前贡献 = 接收者成员数据.联军贡献 ?? 0;
                if (当前贡献 < 数量) {
                    throw new Error(
                        `目标贡献不足：当前 ${格式化(当前贡献)}，至少需要 ${格式化(数量)}`
                    );
                }

                const 新联军成员列表 = {
                    ...(联军资料.联军成员列表 ?? {}),
                    [接收者UID]: {
                        ...接收者成员数据,
                        联军贡献: 当前贡献 - 数量,
                    },
                };

                await Promise.all([
                    更新玩家资料(ctx, 接收者ID, {
                        私人军队: 接收者当前私人军队 + 数量,
                    }),
                    ctx.database.set(
                        '马列联军表',
                        { 联军编号 },
                        {
                            联军军队: (联军资料.联军军队 ?? 0) - 数量,
                            联军成员列表: 新联军成员列表,
                        }
                    ),
                ]);

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号,
                    通报标题: '联军军务通报',
                    通报内容: `${username} 向 ${接收者显示名} 分配了 ${格式化(数量)} 联军军队`,
                });

                return `
====[征战文游]====
${username} 同志：
已向 ${接收者显示名} 分配联军军队 ${格式化(数量)}
■ 联军剩余军队：${格式化((联军资料.联军军队 ?? 0) - 数量)}
■ ${接收者显示名} 私人军队：${格式化(接收者当前私人军队 + 数量)}
■ ${接收者显示名} 联军贡献：${格式化(当前贡献 - 数量)}(-${格式化(数量)})
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
