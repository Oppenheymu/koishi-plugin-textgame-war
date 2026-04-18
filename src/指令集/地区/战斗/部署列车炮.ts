import type { Context } from 'koishi';
import { 更新地区战略资料, 更新玩家资料, 驻扎检查 } from '@/utils';
import { 部署列车炮权限检查 } from '@/utils/解析目标/地区相关/权限检查';

function 格式化(n: number) {
    return n.toLocaleString('zh-CN');
}

export function 部署列车炮(ctx: Context) {
    ctx.command('部署列车炮 [数量:number]')
        .alias('部署列车炮到地区')
        .action(async ({ session }, 数量输入) => {
            try {
                const {
                    id,
                    用户资料,
                    username,
                    当前驻扎地区,
                    地区编号,
                    展示地区名称,
                    地区战略资料,
                } = await 驻扎检查(ctx, session);

                if (当前驻扎地区 !== 地区编号) {
                    return `你当前驻扎在 ${当前驻扎地区 || '未驻扎地区'}，仅驻扎在本地区的玩家可部署列车炮`;
                }

                await 部署列车炮权限检查(ctx, session, 地区编号);

                if (!地区战略资料.是否有铁路) {
                    return '该地区暂无铁路，无法部署列车炮';
                }

                if (
                    !Number.isFinite(数量输入) ||
                    (数量输入 as number) <= 0 ||
                    !Number.isInteger(数量输入 as number)
                ) {
                    return '请输入有效的正整数数量';
                }

                const 数量 = 数量输入 as number;

                if (用户资料.列车炮 < 数量) {
                    return `列车炮不足：你拥有 ${格式化(用户资料.列车炮)} 门，需要 ${格式化(数量)} 门`;
                }

                await Promise.all([
                    更新玩家资料(ctx, id, {
                        列车炮: 用户资料.列车炮 - 数量,
                    }),
                    更新地区战略资料(ctx, 地区编号, {
                        已部署列车炮: (地区战略资料.已部署列车炮 ?? 0) + 数量,
                        空闲的列车炮: (地区战略资料.空闲的列车炮 ?? 0) + 数量,
                    }),
                ]);

                return [
                    '====[征战文游]====',
                    `${username} 同志：`,
                    `■ 地区：${展示地区名称}（${地区编号}）`,
                    `■ 部署数量：${格式化(数量)} 门`,
                    `■ 地区已部署列车炮：${格式化((地区战略资料.已部署列车炮 ?? 0) + 数量)} 门`,
                    `■ 地区空闲列车炮：${格式化((地区战略资料.空闲的列车炮 ?? 0) + 数量)} 门`,
                    `■ 你剩余列车炮：${格式化(用户资料.列车炮 - 数量)} 门`,
                ].join('\n');
            } catch (error) {
                return (error as Error).message;
            }
        });
}
