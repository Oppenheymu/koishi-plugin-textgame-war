import { Context } from 'koishi'
import { 设置资源 } from './增加资源'
import { 他的全部资料 } from './他的全部资料';
import { 初始化服务表 } from './初始化服务表';

export function 文游管理集(ctx: Context) {

    设置资源(ctx);
    他的全部资料(ctx);
    初始化服务表(ctx);

}
