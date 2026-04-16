import type { Context } from "koishi";
import { 地区解析, 当前地区解析 } from "@/utils";

export function 地区配置(ctx: Context) {
	ctx
		.command("地区配置 [地区编号:string]")
		.alias("城市配置")
		.action(async ({ session }, 地区编号参数) => {
			try {
				const 规范地区编号 = 地区编号参数?.trim();
				const { 地区编号, 地区配置资料, 展示地区名称 } = 规范地区编号
					? await 地区解析(ctx, 规范地区编号)
					: await 当前地区解析(ctx, session);

				return `
===[征战文游]===
以下是此地区配置：
■ 地区编号: ${地区编号}
■ 地区名称: ${展示地区名称}
□ QQ: ${地区配置资料.onebot ?? "未绑定"}
□ TG: ${地区配置资料.telegram ?? "未绑定"}
□ Discord: ${地区配置资料.discord ?? "未绑定"}
上次改名日期: ${地区配置资料.上次改名日期 ?? "无记录"}
`.trim();
			} catch (error) {
				return (error as Error).message;
			}
		});
}
