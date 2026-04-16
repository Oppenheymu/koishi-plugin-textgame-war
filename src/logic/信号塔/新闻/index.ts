import type { Context } from "koishi";
import { 获取运行时配置 } from "@/config";
import type { 信号塔平台 } from "../联军/types";
import type {
	新闻信号塔发送参数,
	新闻信号塔发送结果,
	新闻信号塔发送记录,
	新闻信号塔发送失败记录,
} from "./types";

export * from "./types";

const 信号塔平台列表: 信号塔平台[] = ["onebot", "discord", "telegram"];

function 标准化频道列表(频道列表: string[]): string[] {
	return Array.from(
		new Set(频道列表.map((频道) => 频道.trim()).filter(Boolean)),
	);
}

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

	const 已发送: 新闻信号塔发送记录[] = [];
	const 发送失败: 新闻信号塔发送失败记录[] = [];

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
						await 平台机器人.sendMessage(群聊ID, 文本);
						已发送.push({ 平台, 群聊ID });
					} catch (error) {
						const 错误信息 =
							error instanceof Error ? error.message : "未知错误";

						logger.warn(`新闻信号塔发送失败：${平台}:${群聊ID}，${错误信息}`);

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
	try {
		return await 发送新闻信号塔通报(ctx, 参数);
	} catch (error) {
		const 错误信息 = error instanceof Error ? error.message : "未知错误";
		ctx.logger("信号塔:新闻").warn(`新闻信号塔流程异常：${错误信息}`);
		return null;
	}
}
