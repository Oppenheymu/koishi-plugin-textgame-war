import type { Context } from "koishi";
import { 玩家联军检查 } from "@/utils";
import { 玩家联军权限设置, 尝试发送联军信号塔通报 } from "@/logic";

function 格式化税率显示(税率百分比: number): string {
	const 标准值 = Math.round(税率百分比 * 100) / 100;
	if (Number.isInteger(标准值)) {
		return `${标准值}%`;
	}
	return `${标准值.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

export function 设置税率(ctx: Context) {
	ctx
		.command("设置税率 <税率:number>")
		.alias("设置联军税率")
		.action(async ({ session }, 税率) => {
			try {
				if (typeof 税率 !== "number" || !Number.isFinite(税率)) {
					return "税率必须是 0 到 100 的数字";
				}

				if (税率 < 0 || 税率 > 100) {
					return "税率必须在 0 到 100 之间";
				}

				const 权限等级需求 = await 玩家联军权限设置(ctx, session, "设置税率");
				const { username, 联军编号, 联军资料 } = await 玩家联军检查(
					ctx,
					session,
					{
						最低权限等级: 权限等级需求,
						是否必须在成员列表: true,
					},
				);

				const 新税率百分比 = Math.round(税率 * 100) / 100;
				const 新税率 = 新税率百分比 / 100;
				const 旧税率百分比 = (联军资料.联军税率 ?? 0) * 100;

				await ctx.database.set(
					"马列联军表",
					{ 联军编号 },
					{
						联军税率: 新税率,
					},
				);

				await 尝试发送联军信号塔通报(ctx, {
					联军编号,
					通报标题: "联军税务通报",
					通报内容: `${username} 将联军税率由 ${格式化税率显示(旧税率百分比)} 调整为 ${格式化税率显示(新税率百分比)}`,
				});

				return `
====[征战文游]====
${username} 同志！
联军税率设置成功
■ 联军编号：${联军编号}
■ 旧税率：${格式化税率显示(旧税率百分比)}
■ 新税率：${格式化税率显示(新税率百分比)}
`.trim();
			} catch (error) {
				return (error as Error).message;
			}
		});
}
