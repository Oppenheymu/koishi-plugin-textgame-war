
import { Context } from 'koishi'



import { 设置资源 } from './增加资源'
import { 他的全部资料 } from './他的全部资料';
import { 初始化服务表 } from './初始化服务表';
import { 初始化地区表 } from './初始化地区表';

const 管理插件列表 = [
    设置资源,
    他的全部资料,
    初始化服务表,
    初始化地区表
];

// 统一挂载所有数据库相关服务
export function 文游管理集(ctx: Context) {
    for ( const 插件 of  管理插件列表 ) {
        ctx.plugin(插件);
    }
}
