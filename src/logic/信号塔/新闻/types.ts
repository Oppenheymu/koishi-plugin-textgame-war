import type { 信号塔平台 } from "../联军/types";

export interface 新闻信号塔发送参数 {
	标题: string;
	内容: string;
	前缀?: string;
}

export interface 新闻信号塔发送记录 {
	平台: 信号塔平台;
	群聊ID: string;
}

export interface 新闻信号塔发送失败记录 {
	平台: 信号塔平台;
	群聊ID?: string;
	原因: string;
}

export interface 新闻信号塔发送结果 {
	标题: string;
	内容: string;
	已发送: 新闻信号塔发送记录[];
	发送失败: 新闻信号塔发送失败记录[];
}
