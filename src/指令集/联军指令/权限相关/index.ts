import {
    我的联军权限
} from "../查询相关/个人/我的联军权限";
import {
    选择政体
} from "./选择政体";

import {
    权限管理相关
} from "./权限管理";

export {
    选择政体
};

export const 权限相关指令 = [
    选择政体,
    ...权限管理相关
];
