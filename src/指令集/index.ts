


import { Context } from 'koishi'
import { 生产指令 } from './生产指令/index'
import { 基础指令 } from './基础指令';

export function 文游指令集(ctx: Context) {

    基础指令(ctx);
    生产指令(ctx);

}
