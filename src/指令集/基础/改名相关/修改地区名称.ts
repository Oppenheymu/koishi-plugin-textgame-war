import type { Context } from "koishi";
import { 创建改名审核工单, 检查改名冷却, 校验名称文本 } from "@/logic";
import { 玩家联军检查, 当前地区解析, 地区解析 } from "@/utils";

export function 修改地区名称(ctx: Context) {
	ctx
		.command("修改地区名称 <新名称:string> [地区编号:string]")
		.alias("地区命名")
		.alias("地区改名")
		.alias("城市改名")
		.alias("城市命名")
		.alias("修改城市名称")
		.action(async ({ session }, 新名称, 地区编号参数) => {
			try {
				const { id, uid, username, 联军资料 } = await 玩家联军检查(
					ctx,
					session,
					{
						最低权限等级: 4,
						是否必须在成员列表: true,
					},
				);

				const 规范地区编号 = 地区编号参数?.trim();
				const { 地区编号, 地区配置资料 } = 规范地区编号
					? await 地区解析(ctx, 规范地区编号)
					: await 当前地区解析(ctx, session);

				if (!联军资料.联军地区列表.includes(地区编号)) {
					return "只能修改本联军控制地区的名称";
				}

				const 改名冷却提示 = 检查改名冷却(地区配置资料.上次改名日期, "地区");
				if (改名冷却提示) {
					return 改名冷却提示;
				}

				const 规范名称 = 新名称?.trim() ?? "";
				const 校验结果 = 校验名称文本(规范名称, "地区");
				if (校验结果) {
					return 校验结果;
				}

				const { 工单编号 } = await 创建改名审核工单(ctx, {
					类型: "地区",
					新名称: 规范名称,
					申请人ID: id,
					申请人UID: uid,
					申请人名称: username,
					地区编号,
				});

				return `
====[征战文游]====
${username} 同志！
地区改名申请已提交审核。
地区编号：${地区编号}
当前名称：${地区配置资料.地区名称 || "***"}
工单编号：#${工单编号}
`.trim();
			} catch (error) {
				return (error as Error).message;
			}
		});
}
