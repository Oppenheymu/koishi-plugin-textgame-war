import { 修建地堡 } from "#/interfaces/commands/player/地堡/修建地堡";
import { 地堡查询指令 } from "#/interfaces/commands/player/地堡/地堡查询";
import { 转移地堡物资 } from "#/interfaces/commands/player/地堡/地堡物资转移";

export const 地堡指令 = [转移地堡物资, 修建地堡, ...地堡查询指令];
