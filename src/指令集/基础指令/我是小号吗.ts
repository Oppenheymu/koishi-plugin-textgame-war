import { Context } from 'koishi'
import { 是否为小号 } from '../../Utils/';

export function 我是小号吗(ctx: Context) {
    ctx.command('我是小号吗').alias('小号检查')
        .action(async ({ session }) => {
            try {
                if (await 是否为小号(session, ctx)) {
                    return '你是小号'
                } else {
                    return '你不是小号'
                }
            } catch (error) {
                return (error as Error).message;
            }
        });
}
