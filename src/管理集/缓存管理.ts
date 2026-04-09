import { Context } from "koishi";
import {
    按前缀删除缓存,
    清空缓存,
    获取缓存概览,
    获取统一缓存配置,
} from "../utils/缓存管理/core";

export function 缓存管理(ctx: Context) {
    const { adminAuthority } = 获取统一缓存配置();

    ctx.command("缓存状态", { authority: adminAuthority }).action(async () => {
        const 概览 = await 获取缓存概览();
        const 配置 = 获取统一缓存配置();

        return `缓存状态
■ 启用：${概览.enabled ? "是" : "否"}
■ 条目：${概览.size}
■ TTL（地区/玩家/联军/默认）：${配置.regionTTL}/${配置.playerTTL}/${配置.coalitionTTL}/${配置.defaultTTL} 秒`;
    });

    ctx.command("清理缓存 [前缀:text]", { authority: adminAuthority }).action(
        async ({}, 前缀) => {
            const 输入前缀 = 前缀?.trim();

            if (!输入前缀) {
                const 已清理 = await 清空缓存();
                return `缓存已全部清空，共清理 ${已清理} 条`;
            }

            const 已清理 = await 按前缀删除缓存(输入前缀);
            return `已按前缀清理缓存：${输入前缀}，共清理 ${已清理} 条`;
        },
    );
}
