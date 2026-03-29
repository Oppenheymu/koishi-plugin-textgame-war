import { Context } from "koishi";

import { 注册 } from "./注册";
import { 签到 } from "./签到";
import { 查询相关指令 } from "./查询相关";
import { 工人管理指令 } from "./工人管理";
import { 生产制造指令 } from "./生产制造";
import { 科技相关指令 } from "./科技相关";
import { 资源相关指令 } from "./资源相关";
import { 地堡相关指令 } from "./地堡相关";

const 生产插件列表 = [
    签到,
    注册,
    ...查询相关指令,
    ...工人管理指令,
    ...生产制造指令,
    ...科技相关指令,
    ...资源相关指令,
    ...地堡相关指令,
];

export function 生产指令(ctx: Context) {
    const logger = ctx.logger("生产指令模块");
    const 插件总数 = 生产插件列表.length;

    logger.info(`正在初始化生产系统，预计加载 ${插件总数} 个插件`);

    let 成功计数 = 0;
    let 失败计数 = 0;

    for (let i = 0; i < 插件总数; i++) {
        const 插件 = 生产插件列表[i];
        // 兼容处理：如果插件是匿名函数，尝试获取其显示名称
        const 插件名 = 插件.name || `未命名插件-${i}`;
        const startTime = Date.now();

        try {
            // 核心加载语句
            ctx.plugin(插件);

            const costTime = Date.now() - startTime;
            logger.success(
                `[${i + 1}/${插件总数}] ${插件名} 加载完毕 (${costTime}ms)`,
            );
            成功计数++;
        } catch (e) {
            失败计数++;
            logger.error(`[${i + 1}/${插件总数}] ${插件名} 加载失败！`);
            logger.error(e);
        }
    }

    // 最后给一个汇总报告
    if (失败计数 === 0) {
        logger.info(`所有生产指令加载完成，共 ${成功计数} 个。`);
    } else {
        logger.warn(`加载结束。成功: ${成功计数}, 失败: ${失败计数}`);
    }
}
