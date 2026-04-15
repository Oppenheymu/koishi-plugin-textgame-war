import {
    查看地区
} from "./查看地区";
import {
    查看地区军事
} from "./地区军事";
import {
    查看地区地形
} from "./地区地形";
import {
    地区战略相关
} from "./地区战略";



export {
    查看地区,
    查看地区军事,
    查看地区地形,
};

export const 查询相关指令 = [
    查看地区,
    查看地区军事,
    查看地区地形,
    ...地区战略相关,
];
