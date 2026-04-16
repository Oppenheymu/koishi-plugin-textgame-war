import type { Context } from 'koishi';

type 可加载插件 = Parameters<Context['plugin']>[0];

export function 批量加载插件(ctx: Context, 插件列表: 可加载插件[], 模块名: string) {
    const logger = ctx.logger(模块名);
    const 插件总数 = 插件列表.length;

    logger.info(`开始加载，预计 ${插件总数} 个插件`);

    let 成功计数 = 0;
    let 失败计数 = 0;

    for (let i = 0; i < 插件总数; i++) {
        const 插件 = 插件列表[i];
        const 插件名 =
            (
                插件 as {
                    name?: string;
                }
            ).name || `未命名插件-${i}`;
        const startTime = Date.now();

        try {
            ctx.plugin(插件);
            const costTime = Date.now() - startTime;
            logger.success(`[${i + 1}/${插件总数}] ${插件名} 加载完毕 (${costTime}ms)`);
            成功计数++;
        } catch (error) {
            失败计数++;
            logger.error(`[${i + 1}/${插件总数}] ${插件名} 加载失败！`);
            logger.error(error as Error);
        }
    }

    if (失败计数 === 0) {
        logger.info(`加载完成，共 ${成功计数} 个。`);
    } else {
        logger.warn(`加载结束。成功: ${成功计数}, 失败: ${失败计数}`);
    }
}
