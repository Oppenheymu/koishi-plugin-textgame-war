import { Context } from "koishi";
import {
    按前缀删除缓存,
    清空缓存,
    获取缓存状态,
    获取统一缓存配置,
} from "../utils";

export function 缓存管理(ctx: Context) {
    const { adminAuthority } = 获取统一缓存配置();

    ctx.command("缓存状态", { authority: adminAuthority }).action(async () => {
        const 状态 = 获取缓存状态();
        const 总请求 = 状态.hit + 状态.miss;
        const 命中率 = 总请求 > 0 ? ((状态.hit / 总请求) * 100).toFixed(2) : "0.00";

        return `缓存状态
■ 启用：${状态.enabled ? "是" : "否"}
■ 条目：${状态.size}/${状态.maxEntries}
■ 进行中任务：${状态.inflight}
■ 命中/未命中：${状态.hit}/${状态.miss}（${命中率}%）
■ 数据加载次数：${状态.load}
■ 淘汰次数：${状态.evict}`;
    });

    ctx.command("清理缓存 [前缀:text]", { authority: adminAuthority }).action(
        async ({}, 前缀) => {
            const 输入前缀 = 前缀?.trim();

            if (!输入前缀) {
                const 已清理 = 清空缓存();
                return `缓存已全部清空，共清理 ${已清理} 条`;
            }

            const 已清理 = 按前缀删除缓存(输入前缀);
            return `已按前缀清理缓存：${输入前缀}，共清理 ${已清理} 条`;
        },
    );
}
