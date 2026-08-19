import { 权限管理指令 } from "#/interfaces/commands/coalition/权限/权限管理";
import { 选择政体 } from "#/interfaces/commands/coalition/权限/选择政体";

export const 权限指令 = [选择政体, ...权限管理指令];
