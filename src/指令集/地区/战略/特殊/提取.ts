/** biome-ignore-all lint/suspicious/noExplicitAny: koishi的权限判断比较难 */

import dayjs from 'dayjs';
import type { Context } from 'koishi';
import { 更新地区战略资料, 更新玩家资料, 玩家检查, 驻扎检查 } from '@/utils';
import { 地区查询权限检查 } from '@/logic';
import 制取配置 from './config';

// dayjs already imported above

function 格式化(n: number) {
    return n.toLocaleString('zh-CN');
}

function 获取权限动作(物: string) {
    if (物 === '生物武器') return '查看地区生物实验室';
    if (物 === '浓缩铀') return '查看地区离心机组';
    if (物 === '钚') return '查看地区核反应堆';
    return '查看地区生物实验室';
}

export function 提取地区制取产物(ctx: Context) {
    ctx.command('提取 <制取物:string> [建筑编号:number]')
        .alias('提取产物')
        .action(async ({ session }, 制取物, 建筑编号) => {
            try {
                const { id, username, 当前驻扎地区, 地区编号, 展示地区名称, 地区战略资料 } =
                    await 驻扎检查(ctx, session);

                const { 用户资料 } = await 玩家检查(ctx, session);

                if (当前驻扎地区 !== 地区编号) {
                    return `你当前驻扎在 ${当前驻扎地区 || '未驻扎地区'}，仅驻扎在本地区的玩家可提取制取产物`;
                }

                const 权限动作 = 获取权限动作(制取物);
                await 地区查询权限检查(ctx, session, 权限动作 as any, 地区编号);

                const 建筑集合映射: Record<string, Record<number, any>> = {
                    生物武器: (地区战略资料.生物实验室 ?? {}) as Record<number, any>,
                    浓缩铀: (地区战略资料.高速离心级联 ?? {}) as Record<number, any>,
                    钚: (地区战略资料?.核反应堆 ?? {}) as Record<number, any>,
                };

                const 集合键 = 制取物 as keyof typeof 建筑集合映射;
                const 原始映射 = 建筑集合映射[集合键] ?? {};
                const 映射: Record<number, any> = { ...原始映射 };

                let 目标编号: number | null = null;
                if (Number.isFinite(Number(建筑编号))) {
                    目标编号 = Math.max(1, Math.floor(Number(建筑编号) || 1));
                } else {
                    const 找到 = Object.entries(映射).find(([, v]) => v?.是否制备中);
                    if (找到) 目标编号 = Number(找到[0]);
                }

                if (!目标编号)
                    return '未找到正在制备的目标建筑，请指定建筑编号或等待制备完成后再提取';

                const 设施 = 映射[目标编号];
                if (!设施) return `建筑#${目标编号} 未找到`;
                if (!设施.是否制备中) return `建筑#${目标编号} 当前未在制备中`;
                if (!设施.建造时间) return `建筑#${目标编号} 的制备时间记录缺失，无法判断是否完成`;

                const cfg = (制取配置 as any)[制取物];
                if (!cfg) return `未知制取物：${制取物}`;

                const 开始时间 = dayjs(设施.建造时间, 'YYYY-MM-DD HH:mm');
                const 现在 = dayjs();
                const 已过小时 = 现在.diff(开始时间, 'hour');

                if (已过小时 < (cfg.所需小时 ?? 0)) {
                    const 尚需 = (cfg.所需小时 ?? 0) - 已过小时;
                    return `制取尚未完成，还需约 ${尚需} 小时（已过 ${已过小时} 小时）`;
                }

                // 完成：给玩家产物，释放建筑并写日志
                const 产出数量 = cfg.产出数量 ?? 1;
                const 玩家更新: Record<string, number> = {};
                玩家更新[制取物] = ((用户资料 as any)[制取物] ?? 0) + 产出数量;

                映射[目标编号] = {
                    ...设施,
                    是否制备中: false,
                    建造时间: 设施.建造时间 ?? '',
                    日志: [
                        ...(设施?.日志 ?? []),
                        {
                            完成者: username,
                            制备物: 制取物,
                            数量: 产出数量,
                            时间: 现在.format('YYYY-MM-DD HH:mm'),
                        },
                    ],
                };

                await Promise.all([
                    更新玩家资料(ctx, id, 玩家更新 as any),
                    更新地区战略资料(ctx, 地区编号, {
                        ...(集合键 === '生物武器' ? { 生物实验室: 映射 } : {}),
                        ...(集合键 === '浓缩铀' ? { 高速离心级联: 映射 } : {}),
                        ...(集合键 === '钚' ? { 核反应堆: 映射 } : {}),
                    } as any),
                ]);

                return [
                    '====[征战文游]====',
                    `${username} 同志：`,
                    `■ 地区：${展示地区名称}（${地区编号}）`,
                    `■ 建筑：#${目标编号}`,
                    `■ 成果：${制取物} x${格式化(产出数量)}`,
                    `■ 完成时间：${现在.format('YYYY-MM-DD HH:mm')}`,
                ].join('\n');
            } catch (error) {
                return (error as Error).message;
            }
        });
}
