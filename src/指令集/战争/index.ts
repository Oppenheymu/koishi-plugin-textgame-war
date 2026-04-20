import type { Context } from 'koishi';
import { 批量加载插件 } from '@/infrastructure';

import { 军队相关 } from './军队';
import { 发动炮战 } from './发动炮战';
import { 炮击 } from './炮击';

const 战争插件列表 = [...军队相关, 炮击, 发动炮战];

export function 战争指令(ctx: Context) {
    批量加载插件(ctx, 战争插件列表, '战争指令模块');
}
