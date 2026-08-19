import { 军事查询指令 } from "#/interfaces/commands/player/查询/军事";
import { 我的全部资料 } from "#/interfaces/commands/player/查询/我的全部资料";
import { 我的工人 } from "#/interfaces/commands/player/查询/我的工人";
import { 我的科技 } from "#/interfaces/commands/player/查询/我的科技";
import { 我的资料 } from "#/interfaces/commands/player/查询/我的资料";
import { 我的生产次数 } from "#/interfaces/commands/player/查询/生产次数";
import { 资源相关指令 } from "#/interfaces/commands/player/查询/资源";

export const 查询相关指令 = [
    我的资料,
    我的全部资料,
    我的科技,
    我的工人,
    我的生产次数,
    ...军事查询指令,
    ...资源相关指令,
];
