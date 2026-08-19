import { 每小时联军权力检测 } from "#ctx/coalition/application/权力动态分配";
import { 每日联军资本增量统计 } from "#ctx/coalition/application/生产总值统计";

export * from "#ctx/coalition/application/权力动态分配";
export * from "#ctx/coalition/application/生产总值统计";

export const 联军服务列表 = [每小时联军权力检测, 每日联军资本增量统计];
