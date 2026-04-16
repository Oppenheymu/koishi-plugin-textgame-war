import type { Context } from "koishi";
import { 目标解析 } from "@/utils";

export function 他的UID(ctx: Context) {
	ctx
		.command("他的UID <目标:string>")
		.alias("查看他的UID")
		.alias("他的唯一标识符")
		.alias("他的编号")
		.action(async ({ session }, 目标) => {
			try {
				const { 目标用户名, 目标用户资料 } = await 目标解析(ctx, session, 目标);

				return `${目标用户名} 的UID是：${目标用户资料.uid}`;
			} catch (error) {
				return (error as Error).message;
			}
		});
}
