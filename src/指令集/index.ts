import type { Context } from 'koishi';
import { 批量加载插件 } from '@/infrastructure';
import { 地区指令 } from './地区';
import { 基础指令 } from './基础';
import { 生产指令 } from './玩家核心';
import { 联军指令 } from './联军';

const 生产插件列表 = [基础指令, 联军指令, 生产指令, 地区指令];

export function 文游指令集(ctx: Context) {
    批量加载插件(ctx, 生产插件列表, '文游指令集模块');
}
