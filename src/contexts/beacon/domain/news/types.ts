import type { 信号塔平台 } from "#ctx/beacon/domain/coalition/types";

export interface 新闻信号塔发送参数 {
    标题: string;
    内容: string;
    前缀?: string;
}

export interface 新闻信号塔发送结果 {
    标题: string;
    内容: string;
    已发送: Array<{ 平台: 信号塔平台; 群聊ID: string }>;
    发送失败: Array<{ 平台: 信号塔平台; 群聊ID?: string; 原因: string }>;
}
