import { 他的UID } from "#/interfaces/commands/common/跨端相关/他的UID";
import { 地区配置 } from "#/interfaces/commands/common/跨端相关/地区配置";
import { 我的UID } from "#/interfaces/commands/common/跨端相关/我的UID";
import { 我的账户配置 } from "#/interfaces/commands/common/跨端相关/我的配置";
import { 绑定地区 } from "#/interfaces/commands/common/跨端相关/绑定地区";
import { 绑定账户 } from "#/interfaces/commands/common/跨端相关/绑定账户";

export const 跨端相关指令 = [绑定账户, 我的账户配置, 我的UID, 他的UID, 绑定地区, 地区配置];
