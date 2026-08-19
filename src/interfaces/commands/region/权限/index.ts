import { 行为管理 } from "#/interfaces/commands/region/权限/行为管理";
import { 设置司令 } from "#/interfaces/commands/region/权限/设置司令";
import { 设置总督 } from "#/interfaces/commands/region/权限/设置总督";

export const 地区权限指令 = [...行为管理, 设置总督, 设置司令];
