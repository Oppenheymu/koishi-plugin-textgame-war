import type { Context } from 'koishi';
import { 获取运行时配置 } from '@/config';
import type { 发送失败记录, 发送记录 } from '../utils';
import { 信号塔平台列表, 尝试执行, 标准化频道列表 } from '../utils';

export interface 后台信号塔发送参数 {
    内容: string;
    标题?: string;
    级别?: 'INFO' | 'WARN' | 'ERROR';
}

export interface 后台信号塔发送结果 {
    标题: string;
    级别: 'INFO' | 'WARN' | 'ERROR';
    内容: string;
    已发送: 发送记录[];
    发送失败: 发送失败记录[];
}

function 构建后台日志文本(参数: {
    标题: string;
    级别: 'INFO' | 'WARN' | 'ERROR';
    内容: string;
}): string {
    return [`【后台日志:${参数.级别}】${参数.标题}`, 参数.内容].join('\n');
}

export async function 发送后台信号塔日志(
    ctx: Context,
    参数: 后台信号塔发送参数
): Promise<后台信号塔发送结果> {
    const 内容 = 参数.内容?.trim();
    if (!内容) {
        throw new Error('后台信号塔发送失败：缺少日志内容');
    }

    const 标题 = 参数.标题?.trim() || '系统事件';
    const 级别 = 参数.级别 ?? 'INFO';
    const 文本 = 构建后台日志文本({ 标题, 级别, 内容 });
    const logger = ctx.logger('信号塔:后台');

    const 已发送: 发送记录[] = [];
    const 发送失败: 发送失败记录[] = [];

    const 后台群配置 = 获取运行时配置().信号塔.后台群;

    await Promise.all(
        信号塔平台列表.map(async (平台) => {
            const 群聊列表 = 标准化频道列表(后台群配置[平台]);
            if (!群聊列表.length) return;

            const 平台机器人 = Object.values(ctx.bots).find((bot) => bot.platform === 平台);

            if (!平台机器人) {
                发送失败.push({
                    平台,
                    原因: '未找到可用机器人',
                });
                return;
            }

            await Promise.all(
                群聊列表.map(async (群聊ID) => {
                    try {
                        await 平台机器人.sendMessage(群聊ID, 文本);
                        已发送.push({ 平台, 群聊ID });
                    } catch (error) {
                        const 错误信息 = error instanceof Error ? error.message : '未知错误';

                        logger.warn(`后台信号塔发送失败：${平台}:${群聊ID}，${错误信息}`);

                        发送失败.push({
                            平台,
                            群聊ID,
                            原因: 错误信息,
                        });
                    }
                })
            );
        })
    );

    return {
        标题,
        级别,
        内容,
        已发送,
        发送失败,
    };
}

export async function 尝试发送后台信号塔日志(
    ctx: Context,
    参数: 后台信号塔发送参数
): Promise<后台信号塔发送结果 | null> {
    return 尝试执行(ctx.logger('信号塔:后台'), '后台信号塔', () => 发送后台信号塔日志(ctx, 参数));
}
