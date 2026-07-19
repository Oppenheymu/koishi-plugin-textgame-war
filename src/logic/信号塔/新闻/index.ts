/** biome-ignore-all lint/suspicious/noExplicitAny: 如下
 * 代码里用 any 主要是为了在运行时做快速诊断
 * 并避免 TypeScript 在编译时报错
 * 开发时临时绕过类型系统
 * 以方便查看未知运行时字段或不同平台机器人对象差异
 */

import type { Context } from "koishi";
import { 获取运行时配置 } from "#/config";
import type { 发送失败记录, 发送记录 } from "../utils";
import { 信号塔平台列表, 尝试执行, 标准化频道列表 } from "../utils";
import type { 新闻信号塔发送参数, 新闻信号塔发送结果 } from "./types";

export * from "./types";

function 构建新闻通报文本(参数: {
    标题: string;
    内容: string;
    前缀: string;
}): string {
    return [`【${参数.前缀}】${参数.标题}`, 参数.内容].join("\n");
}

export async function 发送新闻信号塔通报(
    ctx: Context,
    参数: 新闻信号塔发送参数,
): Promise<新闻信号塔发送结果> {
    const 标题 = 参数.标题?.trim();
    if (!标题) {
        throw new Error("新闻信号塔发送失败：缺少标题");
    }

    const 内容 = 参数.内容?.trim();
    if (!内容) {
        throw new Error("新闻信号塔发送失败：缺少内容");
    }

    const 前缀 = 参数.前缀?.trim() || "新闻播报";
    const 文本 = 构建新闻通报文本({ 标题, 内容, 前缀 });
    const logger = ctx.logger("信号塔:新闻");

    const 已发送: 发送记录[] = [];
    const 发送失败: 发送失败记录[] = [];

    const 新闻群配置 = 获取运行时配置().信号塔.新闻群;

    await Promise.all(
        信号塔平台列表.map(async (平台) => {
            const 群聊列表 = 标准化频道列表(新闻群配置[平台]);
            if (!群聊列表.length) return;

            const 平台机器人 = Object.values(ctx.bots).find(
                (bot) => bot.platform === 平台,
            );

            if (!平台机器人) {
                发送失败.push({
                    平台,
                    原因: "未找到可用机器人",
                });
                return;
            }

            await Promise.all(
                群聊列表.map(async (群聊ID) => {
                    try {
                        // diagnostic: log bot shape when first used
                        if (!(logger as any)[`__diagnosed_${平台}_${群聊ID}`]) {
                            try {
                                const shape = {
                                    platform: (平台机器人 as any)?.platform,
                                    has_sendMessage: typeof (平台机器人 as any)
                                        ?.sendMessage,
                                    has_send: typeof (平台机器人 as any)?.send,
                                    has__request: typeof (平台机器人 as any)
                                        ?._request,
                                    keys: Object.keys(
                                        (平台机器人 as any) || {},
                                    ).slice(0, 20),
                                };
                                logger.debug(
                                    `新闻信号塔-机器人形状: ${JSON.stringify(shape)}`,
                                );
                            } catch (e) {
                                logger.debug(
                                    `新闻信号塔-机器人形状获取失败: ${(e as Error).message}`,
                                );
                            }
                            (logger as any)[`__diagnosed_${平台}_${群聊ID}`] =
                                true;
                        }

                        await 平台机器人.sendMessage(群聊ID, 文本);
                        已发送.push({ 平台, 群聊ID });
                    } catch (error) {
                        const 错误信息 =
                            error instanceof Error ? error.message : "未知错误";

                        logger.warn(
                            `新闻信号塔发送失败：${平台}:${群聊ID}，${错误信息}`,
                        );

                        发送失败.push({
                            平台,
                            群聊ID,
                            原因: 错误信息,
                        });
                    }
                }),
            );
        }),
    );

    return {
        标题,
        内容,
        已发送,
        发送失败,
    };
}

export async function 尝试发送新闻信号塔通报(
    ctx: Context,
    参数: 新闻信号塔发送参数,
): Promise<新闻信号塔发送结果 | null> {
    return 尝试执行(ctx.logger("信号塔:新闻"), "新闻信号塔", () =>
        发送新闻信号塔通报(ctx, 参数),
    );
}
