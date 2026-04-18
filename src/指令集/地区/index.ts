import type { Context } from 'koishi';
import { 批量加载插件 } from '../../utils/插件加载';
import { 地区建筑指令 } from './建筑';
import { 我的驻扎 } from './我的驻扎';
import { 地区战略指令 } from './战略';
import { 地区权限相关指令 } from './权限';
import { 查询相关指令 } from './查询';
import { 地区资源指令 } from './资源';
import { 驻扎 } from './驻扎';
import { 地区战斗指令 } from './战斗';

const 地区指令列表 = [
    ...查询相关指令,
    ...地区战略指令,
    ...地区资源指令,
    ...地区建筑指令,
    ...地区权限相关指令,
    ...地区战斗指令,
    驻扎,
    我的驻扎,
];

export function 地区指令(ctx: Context) {
    批量加载插件(ctx, 地区指令列表, '地区指令模块');
}
