import { Context } from "koishi";
import { 每日重置签到检查 } from "./每日重置签到";
import { 每小时重置生产 } from "./每时重置生产";
import { 每日全服数据统计 } from "./全服数据统计";
import { 每小时联军权力检测 } from "./联军相关/权力检测";
import { 批量加载插件 } from "../utils/插件加载";

const 服务插件列表 = [
    每日重置签到检查,
    每小时重置生产,
    每日全服数据统计,
    每小时联军权力检测,
];

export function 文游服务集(ctx: Context) {
    批量加载插件(ctx, 服务插件列表, "文游服务集模块");
}
