import { Context } from "koishi";

export function 加载地区表(ctx: Context) {
    ctx.model.extend(
        "马列地区表",
        {
            地区编号: { type: "string", length: 255 },

            地区地形: { type: "string", length: 255 },

            控制国家: { type: "string", length: 255, initial: "" },
            地区总督: { type: "string", length: 255, initial: "" },
            地区司令: { type: "string", length: 255, initial: "" },

            地区驻军: { type: "unsigned", initial: 0 },
            地区堡垒: { type: "unsigned", initial: 0 },

            当前总基础设施: { type: "unsigned", initial: 0 },
            使用的基础设施: { type: "unsigned", initial: 0 },
            基础设施上限: { type: "unsigned", initial: 0 },

            当前总公路容量: { type: "unsigned", initial: 0 },
            使用的公路容量: { type: "unsigned", initial: 0 },
            公路容量上限: { type: "unsigned", initial: 0 },

            当前总机场容量: { type: "unsigned", initial: 0 },
            使用的机场容量: { type: "unsigned", initial: 0 },
            机场容量上限: { type: "unsigned", initial: 0 },

            当前总港口容量: { type: "unsigned", initial: 0 },
            使用的港口容量: { type: "unsigned", initial: 0 },
            港口容量上限: { type: "unsigned", initial: 0 },

            当前总居民区容量: { type: "unsigned", initial: 0 },
            使用的居民区容量: { type: "unsigned", initial: 0 },
            居民区容量上限: { type: "unsigned", initial: 0 },

            当前总仓库容量: { type: "unsigned", initial: 0 },
            使用的仓库容量: { type: "unsigned", initial: 0 },
            仓库容量上限: { type: "unsigned", initial: 0 },

            // 地区建筑
            炼钢厂数量: { type: "unsigned", initial: 0 },
        },
        {
            primary: "地区编号",
            unique: ["地区编号"],
        },
    );
}
