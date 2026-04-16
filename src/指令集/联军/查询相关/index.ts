import { 个人相关 } from './个人';
import { 他的联军 } from './他的联军';
import { 列表相关 } from './列表';
import { 联军生产总值查询 } from './生产总值';
import { 联军生活资料查询 } from './生活资料';
import { 联军编号 } from './联军编号';

export { 他的联军, 联军生产总值查询, 联军生活资料查询, 联军编号 };

export const 查询相关指令 = [
    他的联军,
    联军编号,
    联军生产总值查询,
    联军生活资料查询,
    ...个人相关,
    ...列表相关,
];
