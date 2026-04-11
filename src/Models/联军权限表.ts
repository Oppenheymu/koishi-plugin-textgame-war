import {
    Context
} from "koishi";

export function 加载联军权限表(ctx: Context) {
    ctx.model.extend(
        "马列联军权限表", {
            联军编号: {
                type: "string",
                length: 255
            },
            成员列表: {
                type: "unsigned",
                initial: 4
            },
            地区列表: {
                type: "unsigned",
                initial: 4
            },
            贡献排行: {
                type: "unsigned",
                initial: 4
            },
            邀请加入联军: {
                type: "unsigned",
                initial: 3
            },
            设置联军权限: {
                type: "unsigned",
                initial: 4
            },
            移出联军: {
                type: "unsigned",
                initial: 3
            },
            我的联军权限: {
                type: "unsigned",
                initial: 1
            },
        }, {
            primary: "联军编号",
            unique: ["联军编号"],
        }
    );
}