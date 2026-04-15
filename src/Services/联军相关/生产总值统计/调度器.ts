import { Context } from "koishi";
import { 执行联军资本增量日结 } from "./资本日结";

export function 每日联军资本增量统计(ctx: Context) {
  ctx.cron("*/5 * * * *", () => {
    执行联军资本增量日结(ctx).catch((error) => {
      ctx.logger("联军生产总值统计").error(error);
    });
  });
}
