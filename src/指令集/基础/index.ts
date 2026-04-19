import type { Context } from 'koishi';
import { 批量加载插件 } from '../../utils/插件加载';
import { 改名相关指令 } from './改名相关';

import { 查看版本日志 } from './查看版本日志';
import { 跨端相关指令 } from './跨端相关';
import { ViewMap } from './查看地图';
import { ProduceMap } from './生成地图';

const 基础指令列表 = [查看版本日志, ViewMap, ProduceMap, ...改名相关指令, ...跨端相关指令];

export function 基础指令(ctx: Context) {
    批量加载插件(ctx, 基础指令列表, '基础指令模块');
}
