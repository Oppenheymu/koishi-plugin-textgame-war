import type { Context } from "koishi";
import { 玩家联军权限设置 } from "@/logic";
import { 玩家联军检查 } from "@/utils";

const 格式化 = (n: number) => n.toLocaleString("zh-CN");

export function 分配历史记录(ctx: Context) {
	ctx
		.command("分配历史记录")
		.alias("查看分配历史")
		.alias("联军分配历史")
		.alias("资料分配记录")
		.action(async ({ session }) => {
			try {
				const 权限等级需求 = await 玩家联军权限设置(
					ctx,
					session,
					"分配历史记录",
				);
				const { username, 联军资料 } = await 玩家联军检查(ctx, session, {
					最低权限等级: 权限等级需求,
					是否必须在成员列表: true,
				});

				const 历史列表 = (联军资料.生活资料分配记录 ?? []).slice(0, 20);

				const 文本 = 历史列表.length
					? 历史列表
							.map(
								(记录, 索引) =>
									`${索引 + 1}. ${记录.时间}｜${记录.分配者} → ${记录.接收方}｜${格式化(记录.数量)}`,
							)
							.join("\n")
					: "暂无分配记录";

				return `
====[征战文游]====
${username} 同志：
联军生活资料分配历史：
${文本}
`.trim();
			} catch (error) {
				return (error as Error).message;
			}
		});
}
