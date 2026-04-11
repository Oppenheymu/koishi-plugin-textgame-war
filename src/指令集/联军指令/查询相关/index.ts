import {
    联军编号
} from "./联军编号";
import {
    他的联军
} from "./他的联军";

import {
    个人相关
} from "./个人"
import {
    列表相关
} from "./列表";



export {
    他的联军,
    联军编号,
};

export const 查询相关指令 = [
    他的联军,
    联军编号,
    ...个人相关,
    ...列表相关
];
