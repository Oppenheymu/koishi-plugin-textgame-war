import type { Context } from 'koishi';
import { 修建地区堡垒 } from './要塞';
import {
    修建地区核反应堆,
    修建地区生物实验室,
    修建地区离心机组,
} from './特殊设施';

export { 修建地区堡垒, 修建地区核反应堆, 修建地区生物实验室, 修建地区离心机组 };

/**
 * 注册所有地区建筑相关的指令
 */
export function 注册建筑指令(ctx: Context) {
    修建地区堡垒(ctx);
    修建地区生物实验室(ctx);
    修建地区离心机组(ctx);
    修建地区核反应堆(ctx);
}

export const 地区建筑指令 = [
    修建地区堡垒,
    修建地区生物实验室,
    修建地区离心机组,
    修建地区核反应堆,
];
