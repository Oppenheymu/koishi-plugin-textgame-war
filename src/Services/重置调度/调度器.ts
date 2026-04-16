import type { Context } from "koishi";
import { 执行每日签到重置 } from "./每日签到";
import { 执行每时生产重置 } from "./每时生产";

export function 每日重置签到检查(ctx: Context) {
	ctx.cron("*/5 * * * *", () => {
		执行每日签到重置(ctx).catch((error) => {
			ctx.logger("每日重置签到").error(error);
		});
	});
}

export function 每小时重置生产(ctx: Context) {
	ctx.cron("0 * * * *", () => {
		执行每时生产重置(ctx).catch((error) => {
			ctx.logger("每时重置生产").error(error);
		});
	});
}
