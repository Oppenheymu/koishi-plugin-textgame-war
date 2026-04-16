import { 设置扩军计划 } from './扩军计划';

import { 权限管理相关 } from './权限管理';
import { 选择政体 } from './选择政体';

export { 设置扩军计划, 选择政体 };

export const 权限相关指令 = [选择政体, 设置扩军计划, ...权限管理相关];
