
import { type Context, Logger } from "koishi"

import {
    构建进度条,
    判定地区地形,
    读取地区基础数据
} from "./utils"
import {
    获取容量上限
} from "./logic"
import {
    写入批次
} from "./write"

const logger = new Logger("初始化地区表");

export function 初始化地区表(ctx: Context) {
	ctx
		.command("初始化地区表", {
			authority: 3,
		})
		.action(async ({ session }) => {
			const 发送进度 = async (内容: string) => {
				if (!session) return;
				await session.send(内容);
			};

			try {
				await 发送进度("开始初始化地区表，正在读取地区基础数据...");
				const 地区基础数据 = await 读取地区基础数据();
				const 总数 = 地区基础数据.length;

				logger.info(`初始化地区表开始，总记录数 ${总数}`);
				await 发送进度(`数据读取完成：共 ${总数} 条，开始写入数据库...`);

				const 批次大小 = 500;
				let 已处理 = 0;

				// 优化：在此处进行分批处理和 map 操作，避免在内存中同时生成多个巨大的完整数组
				for (let i = 0; i < 总数; i += 批次大小) {
					const 基础数据批次 = 地区基础数据.slice(i, i + 批次大小);

					const 地形批次 = 基础数据批次.map((地区) => ({
						地区编号: String(地区.RegionId),
						是否为海洋: 地区.isOcean,
						平均海拔: 地区.MeanElevation,
						最大海拔: 地区.MaxElevation,
						最小海拔: 地区.MinElevation,
						地区崎岖度: 地区.STDElevation,
						水域: 地区.Water,
						雪地: 地区.Snow,
						草地: 地区.Grassland,
						荒地: 地区.Bareland,
						森林: 地区.Forest,
						城镇: 地区.Urban,
					}));

					const 地区批次 = 基础数据批次.map((地区) => {
						const 地区地形 = 判定地区地形(地区);
						const 容量上限 = 获取容量上限(地区, 地区地形);
						return {
							地区编号: 地区.RegionId,
							地区地形,
							...容量上限,
							控制国家: "",
							地区总督: "",
							允许非联军成员驻扎: true,
							允许非联军成员使用机场: true,
							允许机场使用战斗机: true,
							当前总基础设施: 0,
							使用的基础设施: 0,
							当前总公路容量: 0,
							使用的公路容量: 0,
							当前总机场容量: 0,
							使用的机场容量: 0,
							当前总港口容量: 0,
							使用的港口容量: 0,
							当前总居民区容量: 0,
							使用的居民区容量: 0,
							当前总仓库容量: 0,
							使用的仓库容量: 0,
							炼钢厂数量: 0,
							空闲的炼钢厂: 0,
						};
					});

					const 状态机批次 = 基础数据批次.map((地区) => ({
						地区编号: String(地区.RegionId),
						地区归属国: null,
						是否已分配: false,
					}));

					const 配置批次 = 基础数据批次.map((地区) => ({
						地区编号: String(地区.RegionId),
						onebot: "",
						discord: "",
						telegram: "",
						地区名称: "默认名称",
						名称是否审核: true,
						上次改名日期: "",
					}));

					const 战略批次 = 基础数据批次.map((地区) => ({
						地区编号: String(地区.RegionId),
						地区司令: "",
						铁路: {},
						地区驻军: 0,
						地区堡垒: 0,
						生物实验室: {},
						高速离心级联: {},
						核反应堆: {},
						已部署列车炮: 0,
						空闲的列车炮: 0,
						历史战争: [],
					}));

					await 写入批次(
						ctx,
						地形批次,
						地区批次,
						状态机批次,
						配置批次,
						战略批次,
					);

					已处理 += 地区批次.length;

					if (已处理 % (批次大小 * 4) === 0 || 已处理 === 总数) {
						const 进度 = 构建进度条(已处理, 总数);
						logger.info(`初始化地区表进度 ${进度}`);
						await 发送进度(`初始化地区表进度：${进度}`);
					}
				}

				logger.info(`初始化地区表完成，总处理 ${总数} 条`);
				return `地区表初始化完成：共处理 ${总数} 条地区数据`;
			} catch (error) {
				logger.error(`初始化地区表失败：${(error as Error).message}`);
				return `初始化失败: ${(error as Error).message}`;
			}
		});
}
