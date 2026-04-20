import type { Context } from 'koishi';
import {
    尝试发送联军信号塔通报,
    校验联军权限动作,
    校验联军权限等级,
    玩家联军权限设置,
    联军权限动作列表,
    获取政体可设置最小权限等级,
    设置联军操作权限,
} from '@/logic';
import { 玩家联军检查 } from '@/utils';

export function 设置联军权限(ctx: Context) {
    ctx.command('设置联军权限 <操作:string> <权限等级:number>')
        .alias('设置权限')
        .action(async ({ session }, 操作, 权限等级) => {
            try {
                const 权限等级需求 = await 玩家联军权限设置(ctx, session, '设置联军权限');
                const { username, 联军编号, 联军资料 } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 权限等级需求,
                    是否必须在成员列表: true,
                });

                const 目标操作 = 操作?.trim();
                if (!目标操作 || !校验联军权限动作(目标操作)) {
                    return `无效操作名，请使用：${联军权限动作列表.join(' / ')}`;
                }

                if (!校验联军权限等级(权限等级)) {
                    return '权限等级必须是 1 到 4 的整数';
                }

                const 最小可设置等级 = 获取政体可设置最小权限等级(联军资料.联军政治体制, 目标操作);

                if (权限等级 < 最小可设置等级) {
                    return `当前政体（${联军资料.联军政治体制}）下，${目标操作} 最低只能设置为 ${最小可设置等级} 级`;
                }

                await 设置联军操作权限(ctx, 联军编号, 目标操作, 权限等级);

                await 尝试发送联军信号塔通报(ctx, {
                    联军编号,
                    通报标题: '联军政务通报',
                    通报内容: `${username} 将操作「${目标操作}」权限设置为 ${权限等级} 级`,
                });

                return `
====[征战文游]====
${username} 同志！
联军权限更新成功
■ 操作：${目标操作}
■ 新需求等级：${权限等级}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
