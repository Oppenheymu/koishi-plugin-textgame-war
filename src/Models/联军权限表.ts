import { Context } from "koishi";

export function 加载联军权限表(ctx: Context) {
    ctx.model.extend(
        "马列联军权限表",
        {
            联军编号: { type: "string", length: 255 },
            成员列表: { type: "unsigned", initial: 1 },
            地区列表: { type: "unsigned", initial: 1 },
            贡献排行: { type: "unsigned", initial: 1 },
            邀请加入联军: { type: "unsigned", initial: 2 },
            设置联军权限: { type: "unsigned", initial: 1 },
            移出联军: { type: "unsigned", initial: 2 },
            我的联军权限: { type: "unsigned", initial: 0 },
        },
        {
            primary: "联军编号",
            unique: ["联军编号"],
        },
    );
}
