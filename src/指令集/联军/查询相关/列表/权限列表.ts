import type { Context } from "koishi";
import { 玩家联军检查 } from "@/utils";
import { 获取指定等级成员UID列表, 玩家联军权限设置 } from "@/logic";

const 等级映射: Record<string, 1 | 2 | 3 | 4> = {
	"1": 1,
	"2": 2,
	"3": 3,
	"4": 4,
	一级: 1,
	二级: 2,
	三级: 3,
	四级: 4,
};

function 格式化权限列表(
	联军资料: Parameters<typeof 获取指定等级成员UID列表>[0],
	等级: 1 | 2 | 3 | 4,
): string {
	const 成员列表 = 获取指定等级成员UID列表(联军资料, 等级);
	if (!成员列表.length) {
		return "    - 暂无成员";
	}

	return 成员列表.map((uid) => `    - ${uid}`).join("\n");
}

function 创建固定等级命令(ctx: Context, 命令名: string, 等级: 1 | 2 | 3 | 4) {
	ctx.command(命令名).action(async ({ session }) => {
		try {
			const 权限等级需求 = await 玩家联军权限设置(ctx, session, "成员列表");
			const { username, 联军资料 } = await 玩家联军检查(ctx, session, {
				最低权限等级: 权限等级需求,
				是否必须在成员列表: true,
			});

			return `
====[征战文游]====
${username} 同志：
${等级}级权限成员列表：
${格式化权限列表(联军资料, 等级)}
`.trim();
		} catch (error) {
			return (error as Error).message;
		}
	});
}

export function 权限列表(ctx: Context) {
	创建固定等级命令(ctx, "一级权限列表", 1);
	创建固定等级命令(ctx, "二级权限列表", 2);
	创建固定等级命令(ctx, "三级权限列表", 3);
	创建固定等级命令(ctx, "四级权限列表", 4);

	ctx
		.command("权限列表 [等级:string]")
		.alias("查看权限列表")
		.action(async ({ session }, 输入等级) => {
			try {
				const 权限等级需求 = await 玩家联军权限设置(ctx, session, "成员列表");
				const { username, 联军资料 } = await 玩家联军检查(ctx, session, {
					最低权限等级: 权限等级需求,
					是否必须在成员列表: true,
				});

				const 标准输入 = 输入等级?.trim();
				if (!标准输入) {
					return "请指定权限等级：1/2/3/4（或 一级/二级/三级/四级）";
				}

				const 权限等级 = 等级映射[标准输入];
				if (!权限等级) {
					return "无效权限等级，请使用：1/2/3/4（或 一级/二级/三级/四级）";
				}

				return `
====[征战文游]====
${username} 同志：
${权限等级}级权限成员列表：
${格式化权限列表(联军资料, 权限等级)}
`.trim();
			} catch (error) {
				return (error as Error).message;
			}
		});
}
