import type { Context } from "koishi";
import { 玩家联军权限设置, 尝试发送联军信号塔通报 } from "@/logic";
import { 玩家联军检查 } from "@/utils";

const 格式化 = (n: number) => n.toLocaleString("zh-CN");

function 解析扩军计划输入(输入?: string): {
	值: number | undefined;
	描述: string;
} {
	const 文本 = 输入?.trim();

	if (!文本) {
		throw new Error("请输入扩军上限，或输入“无上限”取消限制");
	}

	if (["无上限", "不限", "取消", "清除", "none"].includes(文本.toLowerCase())) {
		return { 值: undefined, 描述: "无上限" };
	}

	const 上限 = Number(文本);
	if (!Number.isFinite(上限) || !Number.isInteger(上限) || 上限 <= 0) {
		throw new Error("扩军上限必须是正整数，或输入“无上限”取消限制");
	}

	return { 值: 上限, 描述: 格式化(上限) };
}

export function 设置扩军计划(ctx: Context) {
	ctx
		.command("设置扩军计划 <上限:string>")
		.alias("联军扩军上限")
		.action(async ({ session }, 上限) => {
			try {
				const 权限等级需求 = await 玩家联军权限设置(
					ctx,
					session,
					"设置扩军计划",
				);
				const { username, 联军编号, 联军资料 } = await 玩家联军检查(
					ctx,
					session,
					{
						最低权限等级: 权限等级需求,
						是否必须在成员列表: true,
					},
				);

				const { 值: 新上限, 描述: 新上限文本 } = 解析扩军计划输入(上限);
				const 旧上限 = 联军资料.扩军计划;
				const 旧上限文本 =
					typeof 旧上限 === "number" && 旧上限 > 0 ? 格式化(旧上限) : "无上限";

				await ctx.database.set(
					"马列联军表",
					{ 联军编号 },
					{
						扩军计划: 新上限 ?? null,
					},
				);

				await 尝试发送联军信号塔通报(ctx, {
					联军编号,
					通报标题: "联军军务通报",
					通报内容: `${username} 调整了扩军计划：${旧上限文本} → ${新上限文本}`,
				});

				return `
====[征战文游]====
${username} 同志！
联军扩军计划设置成功
■ 联军编号：${联军编号}
■ 旧上限：${旧上限文本}
■ 新上限：${新上限文本}
`.trim();
			} catch (error) {
				return (error as Error).message;
			}
		});
}
