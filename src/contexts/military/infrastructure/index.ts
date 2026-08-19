import { 加载联军军衔表 } from "#ctx/military/infrastructure/军衔表";
import { 加载军队表 } from "#ctx/military/infrastructure/军队表";
import { 加载战斗表 } from "#ctx/military/infrastructure/战斗表";

export const 加载军事相关表 = [加载联军军衔表, 加载军队表, 加载战斗表];
