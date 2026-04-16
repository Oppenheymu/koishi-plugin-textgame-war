import type { Context } from "koishi";
import { 玩家联军检查, 获取联军展示名称 } from "@/utils";

export function 我的联军(ctx: Context) {
	ctx
		.command("我的联军")
		.alias("查看我的联军")
		.action(async ({ session }) => {
			try {
				const { username, 联军资料, 权限等级 } = await 玩家联军检查(
					ctx,
					session,
				);
				const 格式化 = (n: number) => n.toLocaleString("zh-CN");
				const 展示联军名称 = 获取联军展示名称(联军资料);

				return `
====[征战文游]====
${username} 同志！
你的联军信息如下：
■ 名称：${展示联军名称}
■ 编号：${联军资料.联军编号}
■ 政体：${联军资料.联军政治体制}
■ 成员：${格式化(联军资料.联军成员数量)} 个
■ 军队：${格式化(联军资料.联军军队)}
■ 首都：${联军资料.联军首都}
今日GDP：${格式化(联军资料.当天内资本增量)}
`.trim();
			} catch (error) {
				return (error as Error).message;
			}
		});
}
