import { 每小时联军权力检测 } from "./权力动态分配/index.js";
import { 每日联军资本增量统计 } from "./生产总值统计/index.js";

export * from "./权力动态分配/index.js";
export * from "./生产总值统计/index.js";

export const 联军服务列表 = [每小时联军权力检测, 每日联军资本增量统计];
