import { Context } from "koishi";
import { 每日重置签到检查 } from "./每日重置签到";
import { 每小时重置生产 } from "./每时重置生产";
import { 每日全服数据统计 } from "./全服数据统计";

export function 文游服务集(ctx: Context) {
    每日重置签到检查(ctx);
    每小时重置生产(ctx);
    每日全服数据统计(ctx);
}
