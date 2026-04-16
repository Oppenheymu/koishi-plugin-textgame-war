import {
    Context,
    Session
} from "koishi";
import {
    更新地区资料,
    地区机场权限设置检查
} from "@/utils";

type 战机权限模式 = "允许战机" | "禁止战机";

function 解析战机权限模式(输入值?: string): 战机权限模式 | null {
    const 标准输入 = 输入值?.trim();
    if (!标准输入) return null;

    if (["允许", "开放", "允许战机", "是", "开", "on"].includes(标准输入)) {
        return "允许战机";
    }

    if (["禁止", "限制", "禁止战机", "否", "关", "off"].includes(标准输入)) {
        return "禁止战机";
    }

    return null;
}

async function 执行战机权限设置(
    ctx: Context,
    session: Session | undefined,
    地区编号参数: string | undefined,
    权限模式: 战机权限模式
): Promise<string> {
    const {
        username,
        地区编号,
        展示地区名称,
        地区资料,
    } = await 地区机场权限设置检查(ctx, session, 地区编号参数);

    const 允许机场使用战斗机 = 权限模式 === "允许战机";
    const 原状态 = 地区资料.允许机场使用战斗机 ?? true;

    if (原状态 === 允许机场使用战斗机) {
        return `${展示地区名称}（${地区编号}）当前已是该战机权限状态`;
    }

    await 更新地区资料(ctx, 地区编号, {
        允许机场使用战斗机,
    });

    return `
====[征战文游]====
${username} 同志！
地区机场战机权限已更新
■ 地区：${展示地区名称}（${地区编号}）
■ 新权限：${允许机场使用战斗机 ? "允许在机场使用战斗机" : "禁止在机场使用战斗机"}
`.trim();
}

export function 设置战机权限(ctx: Context) {
    ctx.command("设置战机权限 <权限模式:string> [地区编号:string]")
        .alias("地区战机权限")
        .alias("设置地区战机权限")
        .action(async ({
            session
        }, 权限模式参数, 地区编号参数) => {
            try {
                const 权限模式 = 解析战机权限模式(权限模式参数);
                if (!权限模式) {
                    return "参数无效，请使用：允许 / 禁止（可选地区编号）";
                }

                return await 执行战机权限设置(ctx, session, 地区编号参数, 权限模式);
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command("解禁战机 [地区编号:string]")
        .alias("允许机场使用战机")
        .alias("允许战机起飞")
        .alias("战机解禁")
        .action(async ({
            session
        }, 地区编号参数) => {
            try {
                return await 执行战机权限设置(ctx, session, 地区编号参数, "允许战机");
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command("禁飞战机 [地区编号:string]")
        .alias("禁止机场使用战机")
        .alias("禁止战机起飞")
        .alias("战机禁飞")
        .action(async ({
            session
        }, 地区编号参数) => {
            try {
                return await 执行战机权限设置(ctx, session, 地区编号参数, "禁止战机");
            } catch (error) {
                return (error as Error).message;
            }
        });
}
