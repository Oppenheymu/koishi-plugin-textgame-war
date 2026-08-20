import { 个人指令 } from "#/interfaces/commands/coalition/查询/个人";
import { 他的联军 } from "#/interfaces/commands/coalition/查询/他的联军";
import { 列表指令 } from "#/interfaces/commands/coalition/查询/列表";
import { 注册联军查询文案 } from "#/interfaces/commands/coalition/查询/文案";
import { 联军生产总值查询 } from "#/interfaces/commands/coalition/查询/生产总值";
import { 联军生活资料查询 } from "#/interfaces/commands/coalition/查询/生活资料";
import { 联军编号 } from "#/interfaces/commands/coalition/查询/联军编号";

export const 查询指令 = [
    注册联军查询文案,
    他的联军,
    联军编号,
    联军生产总值查询,
    联军生活资料查询,
    ...个人指令,
    ...列表指令,
];
