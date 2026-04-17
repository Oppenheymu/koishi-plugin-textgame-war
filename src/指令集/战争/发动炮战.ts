import type { Context } from 'koishi';
import { 尝试发送联军信号塔通报 } from '@/logic';
import { TRandom, 更新玩家资料, 玩家检查, 目标解析 } from '@/utils';

const 操炮所需兵力 = 10;

function 计算可动员重炮数(重炮数量: number, 私人军队数量: number): number {
    return Math.min(重炮数量, Math.floor(私人军队数量 / 操炮所需兵力));
}

function 计算炮战造成损失(动员重炮数: number): number {
    let 总损失 = 0;
    for (let i = 0; i < 动员重炮数; i++) {
        总损失 += TRandom(0, 1, 3);
    }
    return 总损失;
}

function 判定胜负情况(我方损失: number, 对方损失: number): string {
    if (我方损失 === 对方损失) return '平局';

    if (我方损失 < 对方损失) {
        if (我方损失 <= 对方损失 * 0.4) return '大胜';
        return '小胜';
    }

    if (对方损失 <= 我方损失 * 0.4) return '惨败';
    return '小败';
}

export function 发动炮战(ctx: Context) {
    ctx.command('发动炮战 <目标:string>').action(async ({ session }, 目标) => {
        try {
            const { id, username, 用户资料 } = await 玩家检查(ctx, session);

            const 输入目标 = 目标?.trim();
            if (
                !输入目标 &&
                !session?.elements?.some((el) => el.type === 'at')
            ) {
                return `
【红色战争】
${username}同志：
■格式：发动炮战 @对方 / 发动炮战 <UID>
■说明：按可操纵兵力自动动员重炮进行对轰
■规则：10私人军队可操纵1门重炮`.trim();
            }

            const { 目标用户ID, 目标用户名, 目标用户资料 } = await 目标解析(
                ctx,
                session,
                输入目标 ?? ''
            );

            if (目标用户ID === id) {
                return '不能对自己发动炮战';
            }

            const 我方动员重炮 = 计算可动员重炮数(
                用户资料.重炮,
                用户资料.私人军队
            );
            if (我方动员重炮 <= 0) {
                return '你的兵力或重炮不足，无法发动炮战（至少需要10私人军队和1门重炮）';
            }

            const 对方动员重炮 = 计算可动员重炮数(
                目标用户资料.重炮,
                目标用户资料.私人军队
            );
            if (对方动员重炮 <= 0) {
                return `${目标用户名} 当前无法组织重炮应战`;
            }

            const 我方造成损失原始值 = 计算炮战造成损失(我方动员重炮);
            const 对方造成损失原始值 = 计算炮战造成损失(对方动员重炮);

            const 对方重炮损失 = Math.min(
                目标用户资料.重炮,
                我方造成损失原始值
            );
            const 我方重炮损失 = Math.min(用户资料.重炮, 对方造成损失原始值);

            const 我方剩余重炮 = 用户资料.重炮 - 我方重炮损失;
            const 对方剩余重炮 = 目标用户资料.重炮 - 对方重炮损失;

            await Promise.all([
                更新玩家资料(ctx, id, {
                    重炮: 我方剩余重炮,
                }),
                更新玩家资料(ctx, 目标用户ID, {
                    重炮: 对方剩余重炮,
                }),
            ]);

            const 格式化 = (n: number) => n.toLocaleString('zh-CN');
            const 胜负情况 = 判定胜负情况(我方重炮损失, 对方重炮损失);

            const 攻击方联军编号 = 用户资料.所在联军?.trim();
            const 防守方联军编号 = 目标用户资料.所在联军?.trim();
            const 通报任务: Promise<unknown>[] = [];

            if (攻击方联军编号) {
                通报任务.push(
                    尝试发送联军信号塔通报(ctx, {
                        联军编号: 攻击方联军编号,
                        通报标题: '联军炮战通报',
                        通报内容: `${username} 对 ${目标用户名} 发动炮战，结果${胜负情况}；我方损失重炮 ${格式化(我方重炮损失)}，对方损失重炮 ${格式化(对方重炮损失)}`,
                    })
                );
            }

            if (防守方联军编号 && 防守方联军编号 !== 攻击方联军编号) {
                通报任务.push(
                    尝试发送联军信号塔通报(ctx, {
                        联军编号: 防守方联军编号,
                        通报标题: '联军炮战通报',
                        通报内容: `${目标用户名} 遭到 ${username} 发动炮战，结果${胜负情况}；我方损失重炮 ${格式化(对方重炮损失)}，对方损失重炮 ${格式化(我方重炮损失)}`,
                    })
                );
            }

            if (通报任务.length > 0) {
                await Promise.all(通报任务);
            }

            return `
【红色战争】
${username}同志：
====炮战====
□我方胜负情况：${胜负情况}
■我方动员重炮：${格式化(我方动员重炮)}
■对方动员重炮：${格式化(对方动员重炮)}
====损失情况====
□我方：重炮*${格式化(我方重炮损失)}
□对方：重炮*${格式化(对方重炮损失)}
■我方剩余重炮：${格式化(我方剩余重炮)}
■对方剩余重炮：${格式化(对方剩余重炮)}`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
