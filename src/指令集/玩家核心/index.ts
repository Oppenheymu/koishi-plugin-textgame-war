import type { Context } from 'koishi';
import { 批量加载插件 } from '#/infrastructure';
import { 地堡相关指令 } from './地堡';
import { 工人管理指令 } from './工人';
import { 查询相关指令 } from './查询';
import { 注册 } from './注册';
import { 生产制造指令 } from './生产';
import { 科技相关指令 } from './科技';
import { 签到 } from './签到';
import { 资源相关指令 } from './资源';

const 生产插件列表 = [
    签到,
    注册,
    ...查询相关指令,
    ...工人管理指令,
    ...生产制造指令,
    ...科技相关指令,
    ...资源相关指令,
    ...地堡相关指令,
];

export function 生产指令(ctx: Context) {
    批量加载插件(ctx, 生产插件列表, '生产指令模块');
}
