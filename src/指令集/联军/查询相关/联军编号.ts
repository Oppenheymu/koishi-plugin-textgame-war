import type { Context } from 'koishi';
import { 玩家检查, 目标解析 } from '@/utils';

export function 联军编号(ctx: Context) {
    ctx.command('联军编号 [目标:string]')
        .alias('联军ID')
        .alias('国家编号')
        .action(async ({ session }, 目标) => {
            try {
                const 输入目标 = 目标?.trim();

                let 查询用户名: string;
                let 联军编号: string | null;

                if (输入目标) {
                    const { 目标用户名, 目标用户资料 } = await 目标解析(ctx, session, 输入目标);
                    查询用户名 = 目标用户名;
                    联军编号 = 目标用户资料.所在联军;
                } else {
                    const { username, 用户资料 } = await 玩家检查(ctx, session);
                    查询用户名 = username;
                    联军编号 = 用户资料.所在联军;
                }

                if (!联军编号) {
                    throw new Error(`${查询用户名} 同志目前不在任何联军中`);
                }

                return `
====[征战文游]====
${查询用户名} 同志：
联军编号：${联军编号}
`.trim();
            } catch (error) {
                return (error as Error).message;
            }
        });
}
