import { 修建地区建筑 } from "#/interfaces/commands/region/建筑/修建";
import { 修建地区核反应堆, 修建地区生物实验室, 修建地区离心机组 } from "#/interfaces/commands/region/建筑/特殊设施";
import { 修建地区堡垒 } from "#/interfaces/commands/region/建筑/要塞";

export const 地区建筑指令 = [
    修建地区堡垒,
    修建地区生物实验室,
    修建地区离心机组,
    修建地区核反应堆,
    修建地区建筑,
];
