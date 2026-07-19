import type { Context } from 'koishi';
import { 联军权限动作列表, 获取联军权限配置 } from '#/logic';
import { 玩家联军检查 } from '#/utils';

export function 我的联军权限(ctx: Context) {
    ctx.command('我的联军权限')
        .alias('我的权限')
        .action(async ({ session }) => {
            try {
                const { username, 联军编号, 权限等级 } = await 玩家联军检查(ctx, session, {
                    最低权限等级: 1,
                    是否必须在成员列表: true,
                });

                const 联军权限配置 = await 获取联军权限配置(ctx, 联军编号);
                const 权限详情 = 联军权限动作列表
                    .map((动作) => `□ ${动作}: ${联军权限配置[动作]}级`)
                    .join('\n');

                return `
====[征战文游]====
${username} 同志：
■ 你的联军权限：${权限等级}级
■ 联军编号：${联军编号}
联军操作权限需求：
${权限详情}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
