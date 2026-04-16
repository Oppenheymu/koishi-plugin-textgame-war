import type { Session } from 'koishi';
import { 获取铁路类型列表 } from '@/logic';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');

export { 格式化 };

export function 读取引用文本(session: Session | undefined): string {
    const quote = (
        session as Session & {
            quote?: {
                content?: string;
            };
        }
    )?.quote;

    return quote?.content ?? '';
}

export function 解析铁路申请ID(输入?: string, 引用文本?: string): string | null {
    const 文本候选 = [输入?.trim(), 引用文本?.trim()].filter(Boolean) as string[];

    for (const 文本 of 文本候选) {
        const 匹配 = 文本.match(/PENDING-[A-Z0-9-]+/i)?.[0];
        if (匹配) {
            return 匹配.toUpperCase();
        }
    }

    return null;
}

export function 解析铁路类型输入(输入: string | undefined): string | null {
    const 规范输入 = 输入?.trim();
    if (!规范输入) return null;

    const 配置列表 = 获取铁路类型列表();
    const 数字输入 = Number(规范输入);

    if (Number.isInteger(数字输入) && 数字输入 >= 1 && 数字输入 <= 配置列表.length) {
        return 配置列表[数字输入 - 1].类型ID;
    }

    const 命中类型 = 配置列表.find(
        (配置) => 配置.类型ID === 规范输入 || 配置.类型名称 === 规范输入
    );

    return 命中类型?.类型ID ?? null;
}

export function 生成铁路类型提示文本() {
    const 配置列表 = 获取铁路类型列表();

    const 条目文本 = 配置列表
        .map(
            (配置, index) =>
                `${index + 1}. ${配置.类型ID}（${配置.类型名称}）：需要${格式化(配置.需求生产力)}生产力，提供${格式化(配置.提供运力)}运力`
        )
        .join('\n');

    return ['你要修建哪种铁路类型？', 条目文本, '请输入序号或铁路类型名。'].join('\n');
}

export function 生成审核推送文本(参数: {
    申请ID: string;
    发起联军名称: string;
    申请人名称: string;
    铁路类型: string;
    铁路类型名称: string;
    最终需求生产力: number;
    提供运力: number;
}): string {
    return [
        '【铁路修建申请】',
        `${参数.发起联军名称} 的玩家${参数.申请人名称} 申请向本地区修建「${参数.铁路类型}（${参数.铁路类型名称}）」。`,
        `消耗：${格式化(参数.最终需求生产力)}生产力（已计算地形惩罚）`,
        `提供：${格式化(参数.提供运力)}运力`,
        `申请ID：${参数.申请ID}`,
        `请有权限的成员回复：同意铁路 ${参数.申请ID}`,
        `或使用命令：审核铁路 同意 ${参数.申请ID}`,
    ].join('\n');
}

export function 组装铁路修建结果文本(参数: {
    标题: string;
    玩家名称: string;
    铁路类型: string;
    铁路类型名称: string;
    实际投入生产力: number;
    当前进度: number;
    是否完工: boolean;
    附加文案?: string;
}): string {
    return [
        参数.标题,
        参数.附加文案 ?? `${参数.玩家名称} 同志，铁路建设已执行。`,
        `铁路类型：${参数.铁路类型}（${参数.铁路类型名称}）`,
        `本次投入：${格式化(参数.实际投入生产力)} 生产力`,
        `当前进度：${参数.当前进度.toFixed(2)}%`,
        参数.是否完工 ? '状态：已完工并开通' : '状态：建设中',
    ].join('\n');
}
