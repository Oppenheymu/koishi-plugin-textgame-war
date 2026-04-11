//各种全局状态机储存

export interface Service {
    id: string;

    当前地区洗牌指针: number;

    上次重置签到日期: string;
    上次全服统计日期: string;
}