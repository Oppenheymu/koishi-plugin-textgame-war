import type { Context } from 'koishi';
import { 尝试发送联军信号塔通报 } from '@/logic';
import { TRandom } from '@/infrastructure';
import { 更新玩家资料, 玩家检查, 目标解析 } from '@/utils';

const 操炮所需兵力 = 10;
const 炮击冷却毫秒 = 60 * 60 * 1000;

function 计算可操纵炮数(重炮数量: number, 操作兵力: number): number {
    return Math.min(重炮数量, Math.floor(操作兵力 / 操炮所需兵力));
}

function 计算随机击杀(炮数: number): number {
    let 总击杀 = 0;
    for (let i = 0; i < 炮数; i++) {
        总击杀 += TRandom(0, 1, 3);
    }
    return 总击杀;
}

function 格式化剩余时间(毫秒: number): string {
    const 总秒数 = Math.ceil(毫秒 / 1000);
    const 分钟 = Math.floor(总秒数 / 60);
    const 秒 = 总秒数 % 60;
    return `${分钟}分${秒}秒`;
}

export function 炮击(ctx: Context) {
    ctx.command('炮击 <目标:string>').action(async ({ session }, 目标) => {
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
■格式：炮击 @对方 / 炮击 <UID>
■规则：每小时可炮击一次
■说明：10私人军队可操纵1门重炮`.trim();
            }

            const 上次炮击时间 = 用户资料.上次炮击时间
                ? new Date(用户资料.上次炮击时间).getTime()
                : 0;
            const 当前时间 = Date.now();

            if (上次炮击时间 > 0) {
                const 已过毫秒 = 当前时间 - 上次炮击时间;
                if (已过毫秒 < 炮击冷却毫秒) {
                    return `炮击冷却中，请在 ${格式化剩余时间(炮击冷却毫秒 - 已过毫秒)} 后再试`;
                }
            }

            const { 目标用户ID, 目标用户名, 目标用户资料 } = await 目标解析(
                ctx,
                session,
                输入目标 ?? ''
            );

            if (目标用户ID === id) {
                return '不能炮击自己';
            }

            const 攻击方可操纵炮数 = 计算可操纵炮数(
                用户资料.重炮,
                用户资料.私人军队
            );
            if (攻击方可操纵炮数 <= 0) {
                return '你的兵力或重炮不足，至少需要10私人军队并拥有1门重炮';
            }

            const 炮击总击杀 = 计算随机击杀(攻击方可操纵炮数);
            const 目标实际伤亡 = Math.min(目标用户资料.私人军队, 炮击总击杀);
            const 目标剩余私人军队 = 目标用户资料.私人军队 - 目标实际伤亡;

            let 反击操炮兵力 = 目标剩余私人军队;
            let 反击来源 = '私人军队反击';

            if (目标用户资料.所在联军) {
                const [目标联军资料] = await ctx.database.get('马列联军表', {
                    联军编号: 目标用户资料.所在联军,
                });
                if (目标联军资料) {
                    反击操炮兵力 = 目标联军资料.联军军队;
                    反击来源 = '联军反击';
                }
            }

            const 防守方可操纵炮数 = 计算可操纵炮数(
                目标用户资料.重炮,
                反击操炮兵力
            );
            const 反击总击杀 =
                防守方可操纵炮数 > 0 ? 计算随机击杀(防守方可操纵炮数) : 0;
            const 攻击方实际伤亡 = Math.min(用户资料.私人军队, 反击总击杀);
            const 攻击方剩余私人军队 = 用户资料.私人军队 - 攻击方实际伤亡;

            await Promise.all([
                更新玩家资料(ctx, id, {
                    私人军队: 攻击方剩余私人军队,
                    上次炮击时间: new Date(当前时间).toISOString(),
                }),
                更新玩家资料(ctx, 目标用户ID, {
                    私人军队: 目标剩余私人军队,
                }),
            ]);

            const 格式化 = (n: number) => n.toLocaleString('zh-CN');

            const 攻击方联军编号 = 用户资料.所在联军?.trim();
            const 防守方联军编号 = 目标用户资料.所在联军?.trim();

            const 通报任务: Promise<unknown>[] = [];

            if (攻击方联军编号) {
                通报任务.push(
                    尝试发送联军信号塔通报(ctx, {
                        联军编号: 攻击方联军编号,
                        通报标题: '联军战事通报',
                        通报内容: `${username} 对 ${目标用户名} 发动炮击，造成伤亡 ${格式化(目标实际伤亡)}，我方伤亡 ${格式化(攻击方实际伤亡)}`,
                    })
                );
            }

            if (防守方联军编号 && 防守方联军编号 !== 攻击方联军编号) {
                通报任务.push(
                    尝试发送联军信号塔通报(ctx, {
                        联军编号: 防守方联军编号,
                        通报标题: '联军战事通报',
                        通报内容: `${目标用户名} 遭到 ${username} 炮击，承受伤亡 ${格式化(目标实际伤亡)}，已组织反击并造成对方伤亡 ${格式化(攻击方实际伤亡)}`,
                    })
                );
            }

            if (通报任务.length > 0) {
                await Promise.all(通报任务);
            }

            return `
【红色战争】
${username}同志：
====【炮击完成】====
■ 炮击目标：${目标用户名}
■ 我方重炮：${格式化(攻击方可操纵炮数)}门
■ 造成伤亡：${格式化(目标实际伤亡)} 人
■ 对方反击：${反击来源}，${格式化(防守方可操纵炮数)}门炮
■ 我方伤亡：${格式化(攻击方实际伤亡)} 人
■ 我方剩余私军：${格式化(攻击方剩余私人军队)} 人
■ 目标剩余私军：${格式化(目标剩余私人军队)} 人
■ 下次可炮击：1小时后`.trim();
        } catch (error) {
            return (error as Error).message;
        }
    });
}
