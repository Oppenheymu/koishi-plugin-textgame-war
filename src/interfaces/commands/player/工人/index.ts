import { 召回工人 } from "#/interfaces/commands/player/工人/召回工人";
import { 工人休假 } from "#/interfaces/commands/player/工人/工人休假";
import { 招募工人 } from "#/interfaces/commands/player/工人/招募工人";
import { 查看全球劳动力市场 } from "#/interfaces/commands/player/工人/查看全球劳动力市场";
import { 设置工资 } from "#/interfaces/commands/player/工人/设置工资";

export const 工人管理指令 = [工人休假, 设置工资, 招募工人, 召回工人, 查看全球劳动力市场];
