import { 邀请加入联军 } from './加入联军';
import { 政变 } from './发动政变';
import { 移出联军 } from './移出联军';
import { 组建联军 } from './组建联军';
import { 退出联军 } from './退出联军';

export { 政变, 移出联军, 组建联军, 退出联军, 邀请加入联军 };

export const 联军生命周期 = [政变, 邀请加入联军, 退出联军, 移出联军, 组建联军];
