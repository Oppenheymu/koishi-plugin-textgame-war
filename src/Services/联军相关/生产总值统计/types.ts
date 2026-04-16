export interface 联军生产总值排行项 {
    排名: number;
    联军编号: string;
    展示联军名称: string;
    生产总值: number;
}

export interface 联军生产总值排行推送结果 {
    标题: string;
    排行榜: 联军生产总值排行项[];
    新闻已发送数量: number;
    新闻发送失败数量: number;
}

export interface 联军资本统计执行结果 {
    今天: string;
    是否执行: boolean;
    原因?: string;
    联军数量: number;
    排行榜: 联军生产总值排行项[];
    新闻已发送数量: number;
    新闻发送失败数量: number;
}
