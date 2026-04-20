import type { Context } from 'koishi';
import { 格式化版本列表, 格式化版本日志, 获取版本日志 } from '@/infrastructure';

export function 查看版本日志(ctx: Context) {
    ctx.command('查看征战版本日志 [版本号]', '查看游戏版本日志')
        .alias('版本日志')
        .alias('查看版本日志')
        .action(async (_, 版本号) => {
            // 如果提供了版本号
            if (版本号) {
                const 日志 = 获取版本日志(版本号);
                if (!日志) {
                    return `找不到版本 ${版本号} 的日志。\n${格式化版本列表()}`;
                }
                return 格式化版本日志(日志);
            }

            // 没有版本号时，显示最新版本 + 所有版本列表
            const 最新日志 = 获取版本日志();
            if (!最新日志) {
                return '暂无版本日志';
            }

            return [
                '【最新版本】',
                格式化版本日志(最新日志),
                '',
                '【所有版本】',
                格式化版本列表(),
                '',
                '💡 使用 "查看征战版本日志 1.0.0" 查看指定版本日志',
            ].join('\n');
        });
}
