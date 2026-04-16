import type { Context } from 'koishi';
import { 更新玩家资料, 玩家检查 } from '@/utils';

const 流失比例 = 0.2;

export function 裁军(ctx: Context) {
    ctx.command('私人裁军 <数量:number>')
        .alias('退伍')
        .action(async ({ session }, 数量) => {
            try {
                const { id, username, 用户资料 } = await 玩家检查(ctx, session);
                const 格式化 = (n: number) => n.toLocaleString('zh-CN');

                if (!数量) {
                    return `
【红色战争】
${username}同志：
■格式：私人裁军 <数量>
■作用：按1:1将私人军队转为工人，并返还全部步兵装备
■说明：裁撤军人会有一部分流失到全球劳动力市场`.trim();
                }

                if (!Number.isInteger(数量) || 数量 <= 0) {
                    return '请输入正确的裁军数量';
                }

                if (用户资料.私人军队 < 数量) {
                    return '私人军队不足，无法裁军';
                }

                const 流失工人 = Math.floor(数量 * 流失比例);
                const 回流工人 = 数量 - 流失工人;

                const 新私人军队 = 用户资料.私人军队 - 数量;
                const 新工人 = 用户资料.工人 + 回流工人;
                const 新步兵装备 = 用户资料.步兵装备 + 数量;

                const 全球数据 = (
                    await ctx.database.get('马列全球数据表', {
                        id: 'service',
                    })
                )[0];
                const 当前全球劳动力市场 = 全球数据?.全球劳动力市场 ?? 0;
                const 新全球劳动力市场 = 当前全球劳动力市场 + 流失工人;

                await Promise.all([
                    更新玩家资料(ctx, id, {
                        私人军队: 新私人军队,
                        工人: 新工人,
                        步兵装备: 新步兵装备,
                    }),
                    全球数据
                        ? ctx.database.set(
                              '马列全球数据表',
                              {
                                  id: 'service',
                              },
                              {
                                  全球劳动力市场: 新全球劳动力市场,
                              }
                          )
                        : ctx.database.create('马列全球数据表', {
                              id: 'service',
                              全球劳动力市场: 新全球劳动力市场,
                          }),
                ]);

                return `
【红色战争】
${username}同志：
===裁军完成===
■私军：${格式化(新私人军队)}(-${格式化(数量)})
■工人：${格式化(新工人)}(+${格式化(回流工人)})
■步兵装备：${格式化(新步兵装备)}(+${格式化(数量)})
■流失军人：${格式化(流失工人)}`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
