import { 查看地区地形 } from "#/interfaces/commands/region/查询/地区地形";
import { 查看地区工业 } from "#/interfaces/commands/region/查询/地区工业";
import { 地区战略相关 } from "#/interfaces/commands/region/查询/战略";
import { 查看地区 } from "#/interfaces/commands/region/查询/查看地区";
import { 查看距离 } from "#/interfaces/commands/region/查询/查看距离";
import { 查看附近地区 } from "#/interfaces/commands/region/查询/附近地区";

export const 查询指令 = [
    查看地区,
    查看地区工业,
    查看地区地形,
    查看附近地区,
    查看距离,
    ...地区战略相关,
];
