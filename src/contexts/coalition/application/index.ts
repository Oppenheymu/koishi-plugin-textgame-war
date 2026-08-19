import { 每日联军资本增量统计 } from "#ctx/coalition/application/gdp-stats";
import { 每小时联军权力检测 } from "#ctx/coalition/application/power-dynamics";

export * from "#ctx/coalition/application/gdp-stats";
export * from "#ctx/coalition/application/power-dynamics";

export const 联军服务列表 = [每小时联军权力检测, 每日联军资本增量统计];
