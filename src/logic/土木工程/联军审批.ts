import type { Context } from 'koishi';
import type { RegionConfig } from '@/types';

export type 审批推送平台 = 'onebot' | 'discord' | 'telegram';

export interface 联军审批推送参数 {
    文本内容: string;
    目标地区配置: Pick<RegionConfig, 审批推送平台>;
}

export interface 联军审批推送结果 {
    已发送: Array<{
        平台: 审批推送平台;
        群聊ID: string;
    }>;
    发送失败: Array<{
        平台: 审批推送平台;
        群聊ID?: string;
        原因: string;
    }>;
}

const 支持平台: 审批推送平台[] = ['onebot', 'discord', 'telegram'];

async function 推送联军审批消息(
    ctx: Context,
    参数: 联军审批推送参数
): Promise<联军审批推送结果> {
    const 文本内容 = 参数.文本内容?.trim();
    if (!文本内容) {
        throw new Error('审批推送失败：消息内容不能为空');
    }

    const 已发送: 联军审批推送结果['已发送'] = [];
    const 发送失败: 联军审批推送结果['发送失败'] = [];

    await Promise.all(
        支持平台.map(async (平台) => {
            const 群聊ID = 参数.目标地区配置[平台]?.trim();
            if (!群聊ID) {
                发送失败.push({
                    平台,
                    原因: '目标地区未绑定该平台群聊',
                });
                return;
            }

            const 机器人 = Object.values(ctx.bots).find((bot) => bot.platform === 平台);
            if (!机器人) {
                发送失败.push({
                    平台,
                    群聊ID,
                    原因: '未找到可用机器人',
                });
                return;
            }

            try {
                await 机器人.sendMessage(群聊ID, 文本内容);
                已发送.push({ 平台, 群聊ID });
            } catch (error) {
                const 错误信息 = error instanceof Error ? error.message : '未知错误';
                发送失败.push({
                    平台,
                    群聊ID,
                    原因: 错误信息,
                });
            }
        })
    );

    return {
        已发送,
        发送失败,
    };
}

export async function 请求联军审批(
    ctx: Context,
    参数: 联军审批推送参数
): Promise<联军审批推送结果> {
    return 推送联军审批消息(ctx, 参数);
}

// 兼容外部建议命名，便于后续其他建筑逻辑直接复用。
export const requestAllianceApproval = 请求联军审批;
