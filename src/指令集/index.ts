


import { Context } from 'koishi'
import { 生产指令 } from './生产指令/index'
import { 基础指令 } from './基础指令';
import { 战争指令 } from './战争指令';

export function 文游指令集(ctx: Context) {

    基础指令(ctx);
    生产指令(ctx);
    战争指令(ctx);

}
