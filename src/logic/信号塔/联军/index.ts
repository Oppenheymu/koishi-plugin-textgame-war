import type { Context } from 'koishi';
import { 地区解析, 联军解析 } from '@/utils';
import type { 发送失败记录, 发送记录 } from '../utils';
import { 信号塔平台列表, 尝试执行 } from '../utils';
import type { 信号塔发送参数, 信号塔发送结果 } from './types';

function 构建信号塔通报文本(参数: {
    标题: string;
    展示联军名称: string;
    联军编号: string;
    展示地区名称: string;
    首都地区编号: string;
    通报内容: string;
}): string {
    return [
        `【信号塔】${参数.标题}`,
        `联军：${参数.展示联军名称}（${参数.联军编号}）`,
        `首都：${参数.展示地区名称}（${参数.首都地区编号}）`,
        参数.通报内容,
    ].join('\n');
}

export async function 发送联军信号塔通报(
    ctx: Context,
    参数: 信号塔发送参数
): Promise<信号塔发送结果> {
    const 联军编号 = 参数.联军编号?.trim();
    if (!联军编号) {
        throw new Error('信号塔通报失败：缺少联军编号');
    }

    const 通报内容 = 参数.通报内容?.trim();
    if (!通报内容) {
        throw new Error('信号塔通报失败：缺少通报内容');
    }

    const { 联军资料, 展示联军名称 } = await 联军解析(ctx, 联军编号);

    const 首都地区编号 = 联军资料.联军首都?.trim();
    if (!首都地区编号) {
        throw new Error(`信号塔通报失败：联军 ${联军编号} 未设置首都地区`);
    }

    const { 地区配置资料, 展示地区名称 } = await 地区解析(ctx, 首都地区编号);

    const 标题 = 参数.通报标题?.trim() || '战事预警';
    const 通报文本 = 构建信号塔通报文本({
        标题,
        展示联军名称,
        联军编号,
        展示地区名称,
        首都地区编号,
        通报内容,
    });

    const logger = ctx.logger('信号塔');
    const 已发送: 发送记录[] = [];
    const 发送失败: 发送失败记录[] = [];

    await Promise.all(
        信号塔平台列表.map(async (平台) => {
            const 群聊ID = 地区配置资料[平台]?.trim();
            if (!群聊ID) {
                发送失败.push({
                    平台,
                    原因: '首都地区未绑定该平台群聊',
                });
                return;
            }

            const 平台机器人 = Object.values(ctx.bots).find(
                (bot) => bot.platform === 平台
            );

            if (!平台机器人) {
                发送失败.push({
                    平台,
                    群聊ID,
                    原因: '未找到可用机器人',
                });
                return;
            }

            try {
                await 平台机器人.sendMessage(群聊ID, 通报文本);
                已发送.push({
                    平台,
                    群聊ID,
                });
            } catch (error) {
                const 错误信息 =
                    error instanceof Error ? error.message : '未知错误';

                logger.warn(`信号塔发送失败：${平台}:${群聊ID}，${错误信息}`);

                发送失败.push({
                    平台,
                    群聊ID,
                    原因: 错误信息,
                });
            }
        })
    );

    return {
        联军编号,
        展示联军名称,
        首都地区编号,
        展示地区名称,
        已发送,
        发送失败,
    };
}

export async function 尝试发送联军信号塔通报(
    ctx: Context,
    参数: 信号塔发送参数
): Promise<信号塔发送结果 | null> {
    return 尝试执行(ctx.logger('信号塔'), '信号塔', () =>
        发送联军信号塔通报(ctx, 参数)
    );
}
