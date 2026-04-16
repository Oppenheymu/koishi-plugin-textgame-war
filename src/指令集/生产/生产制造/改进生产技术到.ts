import type { Context } from "koishi";
import { 玩家检查 } from "../../../utils/index";

// 定义确认请求的数据结构
interface UpgradeRequest {
	targetLevel: number;
	time: number;
}

// 模块级变量存储确认状态
const UpgradeTimer: Record<string, UpgradeRequest> = {};
const ConfirmTimeout = 30000; // 30秒超时

export function 改进生产技术到(ctx: Context) {
	ctx
		.command("改进生产技术到 <目标等级:number>")
		.action(async ({ session }, 目标等级) => {
			try {
				const { id, uid, username, 用户资料 } = await 玩家检查(ctx, session);

				// 格式化数字显示
				const 格式化 = (n: number) => n.toLocaleString("zh-CN");

				// 验证输入
				if (!目标等级 || 目标等级 <= 0) {
					return "请输入有效的目标等级！\n例如：改进生产技术到 100";
				}

				const 当前等级 = 用户资料.生产技术;

				// 检查目标等级是否有效
				if (目标等级 > 150) {
					return `目标等级不能超过150！当前上限：150级`;
				}

				if (目标等级 <= 当前等级) {
					return `目标等级必须高于当前等级！当前：${当前等级}级`;
				}

				// 根据公式 T(P) = floor((19*P + 130)^2 / 22201) 计算所需科技等级
				const 所需科技等级 = ((19 * 目标等级 + 130) ** 2 / 22201) | 0;

				// 检查科技等级是否足够
				if (用户资料.生产技术 < 所需科技等级) {
					return `
====[征战文游]====
${username} 同志！
您的科技等级不足！
需要${所需科技等级}级科技
当前科技等级：${用户资料.科技等级}级
`.trim();
				}

				// 计算所需的总生活资料
				let 所需生活资料 = 0;
				for (let i = 当前等级; i < 目标等级; i++) {
					所需生活资料 += 3500 * i;
				}

				// 检查生活资料是否足够
				if (用户资料.生活资料 < 所需生活资料) {
					const 还差 = 所需生活资料 - 用户资料.生活资料;
					return `生活资料不足！需要：${格式化(
						所需生活资料,
					)}，还差：${格式化(还差)}`;
				}

				// === 确认逻辑 ===
				const now = Date.now();
				const existingRequest = UpgradeTimer[uid];

				// 检查是否存在未超时的相同请求
				if (
					existingRequest &&
					now - existingRequest.time < ConfirmTimeout &&
					existingRequest.targetLevel === 目标等级
				) {
					// === 执行升级 ===
					console.log(
						`用户 ${username} (${uid}) 确认改进生产技术到 ${目标等级}`,
					);

					// 扣除生活资料
					const 减少后的生活资料 = 用户资料.生活资料 - 所需生活资料;

					// 更新数据库
					await ctx.database.set(
						"马列玩家表",
						{
							id: id,
						},
						{
							生活资料: 减少后的生活资料,
							生产技术: 目标等级,
						},
					);

					// 清除确认状态
					delete UpgradeTimer[uid];

					// 构建返回信息
					const 升级等级数 = 目标等级 - 当前等级;

					return `
===[征战文游]===
${username} 同志：
成功改进生产技术
■生产技术：${当前等级}→${目标等级} (+${升级等级数}级)
■生活资料：${格式化(减少后的生活资料)} (-${格式化(所需生活资料)})`.trim();
				} else {
					// === 发起确认 ===
					UpgradeTimer[uid] = {
						targetLevel: 目标等级,
						time: now,
					};

					// 设置超时清除
					setTimeout(() => {
						if (UpgradeTimer[uid]?.time === now) {
							delete UpgradeTimer[uid];
							session
								?.send(
									`=====[生产管理]=====\n${username} 同志！\n改进生产技术到 ${目标等级} 的操作已超时`,
								)
								.catch(console.warn);
						}
					}, ConfirmTimeout);

					return `【工业生产】
□从${当前等级}到${目标等级}
■需求科技等级：${所需科技等级}
■需求生活资料：${所需生活资料}
□请在30秒内再次发送命令确认：
改进生产技术到 ${目标等级}`;
				}
			} catch (error) {
				return (error as Error).message;
			}
		});
}
