import dayjs from 'dayjs';
import type { Context, Session } from 'koishi';
import { 获取运行时配置 } from '@/config';
import {
    计算建造进度百分比,
    计算铁路建造成本,
    获取联军操作权限,
    获取铁路类型列表,
    请求联军审批,
} from '@/logic';
import type { PendingRailwayBuild, RegionStrategy, Railroad, TerrainType } from '@/types';
import {
    获取玩家完整资料,
    更新玩家资料,
    玩家检查,
    玩家联军检查,
    地区解析,
    地区驻扎权限设置检查,
    当前地区解析,
} from '@/utils';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');
const 世界银行地区编号 = '16080';

function 生成铁路申请ID(): string {
    return `PENDING-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function 读取引用文本(session: Session | undefined): string {
    const quote = (
        session as Session & {
            quote?: {
                content?: string;
            };
        }
    )?.quote;
    return quote?.content ?? '';
}

function 解析铁路申请ID(输入?: string, 引用文本?: string): string | null {
    const 文本候选 = [输入?.trim(), 引用文本?.trim()].filter(Boolean) as string[];

    for (const 文本 of 文本候选) {
        const 匹配 = 文本.match(/PENDING-[A-Z0-9-]+/i)?.[0];
        if (匹配) {
            return 匹配.toUpperCase();
        }
    }

    return null;
}

function 解析铁路类型输入(输入: string | undefined): string | null {
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

function 生成铁路类型提示文本() {
    const 配置列表 = 获取铁路类型列表();

    const 条目文本 = 配置列表
        .map(
            (配置, index) =>
                `${index + 1}. ${配置.类型ID}（${配置.类型名称}）：需要${格式化(配置.需求生产力)}生产力，提供${格式化(配置.提供运力)}运力`
        )
        .join('\n');

    return ['你要修建哪种铁路类型？', 条目文本, '请输入序号或铁路类型名。'].join('\n');
}

function 生成审核推送文本(参数: {
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

function 读取铁路映射(地区战略资料: RegionStrategy): Record<number, Railroad> {
    return { ...(地区战略资料.铁路 ?? {}) };
}

function 计算下一个铁路编号(铁路映射: Record<number, Railroad>): number {
    const 已有编号 = Object.keys(铁路映射)
        .map((key) => Number(key))
        .filter((编号) => Number.isInteger(编号) && 编号 > 0);

    if (!已有编号.length) return 1;

    return Math.max(...已有编号) + 1;
}

async function 持久化地区铁路(
    ctx: Context,
    地区编号: string,
    铁路映射: Record<number, Railroad>
): Promise<void> {
    await ctx.database.set(
        '马列地区战略表',
        { 地区编号 },
        {
            铁路: 铁路映射,
            是否有铁路: Object.keys(铁路映射).length > 0,
        }
    );
}

interface 执行铁路修建参数 {
    玩家ID: number;
    玩家名称: string;
    用户资料: Awaited<ReturnType<typeof 获取玩家完整资料>>;

    发起地区编号: string;
    目标地区编号: string;

    铁路类型: string;
    铁路类型名称: string;

    最终需求生产力: number;
    提供运力: number;
}

/**
 * 核心建造执行函数：
 * - 扣减玩家工资与生产次数
 * - 将本次可投入生产力写入铁路进度
 * - 进度达到 100% 时切为“正常”并写入开通时间
 */
async function 执行铁路修建(
    ctx: Context,
    参数: 执行铁路修建参数
): Promise<{
    实际投入生产力: number;
    当前进度: number;
    是否完工: boolean;
    铁路编号: number;
}> {
    const 当前生产力 = 参数.用户资料.工人 * 参数.用户资料.生产技术;
    if (当前生产力 <= 0) {
        throw new Error('当前生产力为 0，无法修建铁路');
    }

    if (参数.用户资料.生产次数 <= 0) {
        throw new Error('生产次数不足，无法继续修建铁路');
    }

    const { 地区战略资料 } = await 地区解析(ctx, 参数.发起地区编号);
    const 铁路映射 = 读取铁路映射(地区战略资料);

    let 铁路编号 = Number(
        Object.entries(铁路映射).find(([, 信息]) => 信息.目标地区 === 参数.目标地区编号)?.[0]
    );

    if (!Number.isInteger(铁路编号) || 铁路编号 <= 0) {
        铁路编号 = 计算下一个铁路编号(铁路映射);
    }

    const 旧铁路信息 = 铁路映射[铁路编号];
    const 已投入生产力 = 旧铁路信息?.已投入生产力 ?? 0;
    const 建造需求 = 参数.最终需求生产力;

    if (已投入生产力 >= 建造需求) {
        throw new Error('该铁路已完成建造，无需重复修建');
    }

    const 剩余需求 = 建造需求 - 已投入生产力;
    const 实际投入生产力 = Math.min(当前生产力, 剩余需求);

    if (实际投入生产力 <= 0) {
        throw new Error('当前无需新增投入');
    }

    const 所需工人 = Math.ceil(实际投入生产力 / Math.max(1, 参数.用户资料.生产技术));
    const 工资消耗 = 所需工人 * 参数.用户资料.工人工资;

    if (参数.用户资料.生活资料 < 工资消耗) {
        throw new Error(
            `生活资料不足，需 ${格式化(工资消耗)}，当前 ${格式化(参数.用户资料.生活资料)}`
        );
    }

    const 新投入 = 已投入生产力 + 实际投入生产力;
    const 当前进度 = 计算建造进度百分比(新投入, 建造需求);
    const 是否完工 = 当前进度 >= 100;

    铁路映射[铁路编号] = {
        目标地区: 参数.目标地区编号,
        来源地区: 参数.发起地区编号,
        铁路类型: 参数.铁路类型,
        建造需求,
        已投入生产力: 新投入,
        建造进度: 当前进度,
        铁路状态: 是否完工 ? '正常' : '建设中',
        铁路运力: 参数.提供运力,
        当前负载: 旧铁路信息?.当前负载 ?? 0,
        开通时间: 是否完工
            ? oldOrNow(旧铁路信息?.开通时间)
            : oldOrEmpty(旧铁路信息?.开通时间),
        铁路日志: 旧铁路信息?.铁路日志 ?? [],
    };

    await 持久化地区铁路(ctx, 参数.发起地区编号, 铁路映射);

    await 更新玩家资料(ctx, 参数.玩家ID, {
        生活资料: 参数.用户资料.生活资料 - 工资消耗,
        生产次数: 参数.用户资料.生产次数 - 1,
    });

    return {
        实际投入生产力,
        当前进度,
        是否完工,
        铁路编号,
    };
}

function oldOrNow(原值: string | undefined): string {
    const 标准值 = 原值?.trim();
    return 标准值 || dayjs().format('YYYY-MM-DD HH:mm');
}

function oldOrEmpty(原值: string | undefined): string {
    return 原值?.trim() ?? '';
}

async function 获取有效申请(
    ctx: Context,
    申请ID: string
): Promise<PendingRailwayBuild> {
    const [申请记录] = await ctx.database.get('马列铁路修建申请表', {
        id: 申请ID,
    });

    if (!申请记录) {
        throw new Error(`未找到铁路申请：${申请ID}`);
    }

    if (申请记录.状态 !== 'pending') {
        throw new Error(`该申请已处理，当前状态：${申请记录.状态}`);
    }

    const 当前时间 = dayjs();
    if (申请记录.过期时间 && 当前时间.isAfter(dayjs(申请记录.过期时间))) {
        await ctx.database.set(
            '马列铁路修建申请表',
            { id: 申请记录.id },
            {
                状态: 'expired',
                更新时间: 当前时间.format('YYYY-MM-DD HH:mm'),
                审批备注: '申请已过期',
            }
        );
        throw new Error(`申请已过期：${申请ID}`);
    }

    return 申请记录;
}

async function 执行审核铁路(
    ctx: Context,
    session: Session | undefined,
    操作: '同意' | '驳回',
    申请ID文本?: string,
    备注?: string
): Promise<string> {
    const 引用文本 = 读取引用文本(session);
    const 申请ID = 解析铁路申请ID(申请ID文本, 引用文本);

    if (!申请ID) {
        throw new Error('请提供申请ID，或引用申请消息后发送【审核铁路 同意】');
    }

    const 申请记录 = await 获取有效申请(ctx, 申请ID);

    const 最低权限等级 = await 获取联军操作权限(ctx, 申请记录.目标联军编号, '设置地区驻扎权限');
    const { uid, username, 联军编号 } = await 玩家联军检查(ctx, session, {
        最低权限等级,
        是否必须在成员列表: true,
    });

    if (联军编号 !== 申请记录.目标联军编号) {
        throw new Error('仅目标联军成员可审核该铁路申请');
    }

    const 更新时间 = dayjs().format('YYYY-MM-DD HH:mm');

    if (操作 === '驳回') {
        await ctx.database.set(
            '马列铁路修建申请表',
            { id: 申请记录.id },
            {
                状态: 'rejected',
                更新时间,
                审批人UID: uid,
                审批备注: 备注?.trim() || '目标联军已驳回',
            }
        );

        return `已驳回铁路申请 ${申请记录.id}`;
    }

    const 当前用户资料 = await 获取玩家完整资料(ctx, 申请记录.申请人ID);
    const 执行结果 = await 执行铁路修建(ctx, {
        玩家ID: 申请记录.申请人ID,
        玩家名称: 申请记录.申请人名称,
        用户资料: 当前用户资料,
        发起地区编号: 申请记录.发起地区编号,
        目标地区编号: 申请记录.目标地区编号,
        铁路类型: 申请记录.铁路类型,
        铁路类型名称: 申请记录.铁路类型名称,
        最终需求生产力: 申请记录.最终需求生产力,
        提供运力: 申请记录.提供运力,
    });

    await ctx.database.set(
        '马列铁路修建申请表',
        { id: 申请记录.id },
        {
            状态: 'approved',
            更新时间,
            审批人UID: uid,
            审批备注: 备注?.trim() || '目标联军已同意',
            已投入生产力: 执行结果.实际投入生产力,
        }
    );

    return [
        `铁路申请 ${申请记录.id} 已通过。`,
        `审核人：${username}`,
        `本次投入：${格式化(执行结果.实际投入生产力)} 生产力`,
        `当前进度：${执行结果.当前进度.toFixed(2)}%`,
        执行结果.是否完工 ? '状态：已完工并开通' : '状态：建设中',
    ].join('\n');
}

export function 审核铁路(ctx: Context) {
    ctx.command('审核铁路 <操作:string> [申请ID:text] [备注:text]')
        .action(async ({ session }, 操作, 申请ID, 备注) => {
            try {
                const 规范操作 = 操作?.trim();

                if (['同意', '通过', '批准'].includes(规范操作)) {
                    return await 执行审核铁路(ctx, session, '同意', 申请ID, 备注);
                }

                if (['驳回', '拒绝', '否决'].includes(规范操作)) {
                    return await 执行审核铁路(ctx, session, '驳回', 申请ID, 备注);
                }

                return '操作无效，请使用：审核铁路 同意/驳回 申请ID';
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command('同意铁路 [申请ID:text]')
        .action(async ({ session }, 申请ID) => {
            try {
                return await 执行审核铁路(ctx, session, '同意', 申请ID);
            } catch (error) {
                return (error as Error).message;
            }
        });

    ctx.command('驳回铁路 [申请ID:text] [备注:text]')
        .action(async ({ session }, 申请ID, 备注) => {
            try {
                return await 执行审核铁路(ctx, session, '驳回', 申请ID, 备注);
            } catch (error) {
                return (error as Error).message;
            }
        });
}

export function 修建铁路(ctx: Context) {
    ctx.command('修建铁路 <目标地区:string>')
        .action(async ({ session }, 目标地区参数) => {
            try {
                const 目标地区编号 = 目标地区参数?.trim();
                if (!目标地区编号) {
                    return '请提供目标地区编号，例如：修建铁路 12345';
                }

                const { id, uid, username, 用户资料 } = await 玩家检查(ctx, session);
                const 来源地区结果 = await 当前地区解析(ctx, session);

                await 地区驻扎权限设置检查(ctx, session, 来源地区结果.地区编号);

                const 发起联军编号 = 来源地区结果.地区资料.控制国家?.trim();
                if (!发起联军编号) {
                    return '当前地区暂无控制联军，无法发起铁路修建';
                }

                const [发起联军] = await ctx.database.get('马列联军表', {
                    联军编号: 发起联军编号,
                });
                if (!发起联军) {
                    return `数据异常：未找到发起联军 ${发起联军编号}`;
                }

                await session?.send(生成铁路类型提示文本());
                const 类型输入 = await session?.prompt(120000);
                const 目标类型ID = 解析铁路类型输入(类型输入);
                if (!目标类型ID) {
                    return '铁路类型输入无效，已取消本次修建';
                }

                let 目标地区地形: TerrainType | undefined;
                let 目标地区配置:
                    | {
                          地区编号: string;
                          控制国家: string;
                          onebot: string;
                          discord: string;
                          telegram: string;
                      }
                    | undefined;

                if (目标地区编号 !== 世界银行地区编号) {
                    const 目标地区结果 = await 地区解析(ctx, 目标地区编号);
                    目标地区地形 = 目标地区结果.地区资料.地区地形;
                    目标地区配置 = {
                        地区编号: 目标地区结果.地区编号,
                        控制国家: 目标地区结果.地区资料.控制国家?.trim() || '',
                        onebot: 目标地区结果.地区配置资料.onebot,
                        discord: 目标地区结果.地区配置资料.discord,
                        telegram: 目标地区结果.地区配置资料.telegram,
                    };
                }

                const 建造成本 = 目标地区地形
                    ? 计算铁路建造成本({
                          铁路类型输入: 目标类型ID,
                          地形: 目标地区地形,
                      })
                    : 计算铁路建造成本({
                          铁路类型输入: 目标类型ID,
                      });

                await session?.send('确定要修建该铁路吗？拆除是有成本的（Y/N）');
                const 确认输入 = (await session?.prompt(120000))?.trim().toUpperCase();
                if (!确认输入 || !['Y', 'YES', '是', '确认'].includes(确认输入)) {
                    return '已取消铁路修建';
                }

                if (目标地区编号 === 世界银行地区编号) {
                    const 结果 = await 执行铁路修建(ctx, {
                        玩家ID: id,
                        玩家名称: username,
                        用户资料,
                        发起地区编号: 来源地区结果.地区编号,
                        目标地区编号,
                        铁路类型: 建造成本.类型ID,
                        铁路类型名称: 建造成本.类型名称,
                        最终需求生产力: 建造成本.最终需求生产力,
                        提供运力: 建造成本.提供运力,
                    });

                    return [
                        '【铁路修建】',
                        `${username} 同志，已向世界银行方向发起修建。`,
                        `铁路类型：${建造成本.类型ID}（${建造成本.类型名称}）`,
                        `本次投入：${格式化(结果.实际投入生产力)} 生产力`,
                        `当前进度：${结果.当前进度.toFixed(2)}%`,
                        结果.是否完工 ? '状态：已完工并开通' : '状态：建设中',
                    ].join('\n');
                }

                if (!目标地区配置) {
                    return '目标地区解析失败，请重试';
                }

                const 目标联军编号 = 目标地区配置.控制国家;

                if (!目标联军编号 || 目标联军编号 === 发起联军编号) {
                    const 结果 = await 执行铁路修建(ctx, {
                        玩家ID: id,
                        玩家名称: username,
                        用户资料,
                        发起地区编号: 来源地区结果.地区编号,
                        目标地区编号: 目标地区配置.地区编号,
                        铁路类型: 建造成本.类型ID,
                        铁路类型名称: 建造成本.类型名称,
                        最终需求生产力: 建造成本.最终需求生产力,
                        提供运力: 建造成本.提供运力,
                    });

                    return [
                        '【铁路修建】',
                        `${username} 同志，铁路建设已执行。`,
                        `铁路类型：${建造成本.类型ID}（${建造成本.类型名称}）`,
                        `本次投入：${格式化(结果.实际投入生产力)} 生产力`,
                        `当前进度：${结果.当前进度.toFixed(2)}%`,
                        结果.是否完工 ? '状态：已完工并开通' : '状态：建设中',
                    ].join('\n');
                }

                const [目标联军] = await ctx.database.get('马列联军表', {
                    联军编号: 目标联军编号,
                });
                if (!目标联军) {
                    return `目标地区控制联军不存在：${目标联军编号}`;
                }

                const 待审核记录 = await ctx.database.get('马列铁路修建申请表', {
                    发起地区编号: 来源地区结果.地区编号,
                    目标地区编号: 目标地区配置.地区编号,
                    状态: 'pending',
                });
                if (待审核记录.length > 0) {
                    return `当前线路已有待审核申请：${待审核记录[0].id}`;
                }

                const 申请ID = 生成铁路申请ID();
                const 创建时间 = dayjs();
                const 审批过期小时 = 获取运行时配置().土木工程.跨联军铁路审批过期小时;
                const 过期时间 = 创建时间.add(审批过期小时, 'hour');

                await ctx.database.create('马列铁路修建申请表', {
                    id: 申请ID,
                    状态: 'pending',
                    申请人ID: id,
                    申请人UID: uid,
                    申请人名称: username,
                    发起联军编号,
                    发起联军名称: 发起联军.联军名称,
                    发起地区编号: 来源地区结果.地区编号,
                    目标地区编号: 目标地区配置.地区编号,
                    目标联军编号,
                    目标联军名称: 目标联军.联军名称,
                    铁路类型: 建造成本.类型ID,
                    铁路类型名称: 建造成本.类型名称,
                    最终需求生产力: 建造成本.最终需求生产力,
                    提供运力: 建造成本.提供运力,
                    已投入生产力: 0,
                    创建时间: 创建时间.format('YYYY-MM-DD HH:mm'),
                    更新时间: 创建时间.format('YYYY-MM-DD HH:mm'),
                    过期时间: 过期时间.format('YYYY-MM-DD HH:mm'),
                    审批人UID: '',
                    审批备注: '',
                });

                const 推送文本 = 生成审核推送文本({
                    申请ID,
                    发起联军名称: 发起联军.联军名称,
                    申请人名称: username,
                    铁路类型: 建造成本.类型ID,
                    铁路类型名称: 建造成本.类型名称,
                    最终需求生产力: 建造成本.最终需求生产力,
                    提供运力: 建造成本.提供运力,
                });

                const 推送结果 = await 请求联军审批(ctx, {
                    文本内容: 推送文本,
                    目标地区配置: {
                        onebot: 目标地区配置.onebot,
                        discord: 目标地区配置.discord,
                        telegram: 目标地区配置.telegram,
                    },
                });

                return [
                    '【铁路修建】',
                    `检测到跨联军目标，已提交审核申请：${申请ID}`,
                    `目标联军：${目标联军.联军名称}（${目标联军编号}）`,
                    `需求生产力：${格式化(建造成本.最终需求生产力)}`,
                    `提供运力：${格式化(建造成本.提供运力)}`,
                    `推送成功：${推送结果.已发送.length}，失败：${推送结果.发送失败.length}`,
                ].join('\n');
            } catch (error) {
                return (error as Error).message;
            }
        });
}
