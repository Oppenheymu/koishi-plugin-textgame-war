import type { Context } from "koishi";
import { 地区解析, 用户检查, 玩家联军检查 } from "@/utils";

export function 绑定地区(ctx: Context) {
	ctx
		.command("绑定地区 <地区编号:string>")
		.action(async ({ session }, 地区编号) => {
			try {
				const { 联军资料, username } = await 玩家联军检查(ctx, session, {
					最低权限等级: 4,
					是否必须在成员列表: true,
				});

				const 规范地区编号 = 地区编号?.trim();
				if (!规范地区编号) {
					return "请提供地区编号";
				}

				const { platform } = 用户检查(session);
				const 群聊ID = session?.guildId?.trim();
				if (!群聊ID) {
					return "请在群聊中使用该指令";
				}

				const { 地区编号: 目标地区编号, 地区配置资料 } = await 地区解析(
					ctx,
					规范地区编号,
				);

				if (!联军资料.联军地区列表.includes(目标地区编号)) {
					return "只能绑定本联军控制地区";
				}

				const 当前群绑定列表 = await ctx.database.get("马列地区配置表", {
					[platform]: 群聊ID,
				});
				const 当前群其他绑定 = 当前群绑定列表.find(
					(记录) => 记录.地区编号 !== 目标地区编号,
				);
				if (当前群其他绑定) {
					return `当前群已绑定地区：${当前群其他绑定.地区编号}`;
				}

				const 已绑定群聊 =
					地区配置资料[platform as "onebot" | "discord" | "telegram"];
				if (已绑定群聊 && 已绑定群聊 !== 群聊ID) {
					return "该地区在当前平台已绑定其他群聊";
				}

				await ctx.database.set(
					"马列地区配置表",
					{
						地区编号: 目标地区编号,
					},
					{
						[platform]: 群聊ID,
					},
				);

				return `
====[征战文游]====
${username} 同志！
地区绑定成功：${目标地区编号}
`.trim();
			} catch (error) {
				return (error as Error).message;
			}
		});
}
