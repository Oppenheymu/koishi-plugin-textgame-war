/** biome-ignore-all lint/suspicious/noExplicitAny: 动态流程不好做静态类型 */

import dayjs from 'dayjs';
import type { Context } from 'koishi';
import { 更新地区战略资料, 更新玩家资料, 玩家检查, 驻扎检查 } from '@/utils';
import { 地区查询权限检查 } from '@/utils/解析目标/地区相关/权限检查';
import 制取配置 from './config';

function 格式化(n: number) {
    return n.toLocaleString('zh-CN');
}

function 获取权限动作(物: string) {
    if (物 === '生物武器') return '查看地区生物实验室';
    if (物 === '浓缩铀') return '查看地区离心机组';
    if (物 === '钚') return '查看地区核反应堆';
    return '查看地区生物实验室';
}

export function 制取地区资源(ctx: Context) {
    ctx.command('制取 <制取物:string> [建筑编号:number]')
        .alias('开始制取')
        .action(async ({ session }, 制取物输入, 建筑编号) => {
            try {
                const {
                    id,
                    username,
                    当前驻扎地区,
                    地区编号,
                    展示地区名称,
                    地区战略资料,
                } = await 驻扎检查(ctx, session);

                const { 用户资料 } = await 玩家检查(ctx, session);

                if (当前驻扎地区 !== 地区编号) {
                    return `你当前驻扎在 ${当前驻扎地区 || '未驻扎地区'}，仅驻扎在本地区的玩家可发起制取`;
                }

                const 制取物 = 制取物输入?.trim();
                if (!制取物 || !(制取物 in 制取配置)) {
                    return `未知制取物，请选择：${Object.keys(制取配置).join('、')}`;
                }

                const 权限动作 = 获取权限动作(制取物);
                await 地区查询权限检查(ctx, session, 权限动作 as any, 地区编号);

                // 选择对应建筑集合
                const 建筑集合映射: Record<string, Record<number, any>> = {
                    生物武器: (地区战略资料.生物实验室 ?? {}) as Record<
                        number,
                        any
                    >,
                    浓缩铀: (地区战略资料.高速离心级联 ?? {}) as Record<
                        number,
                        any
                    >,
                    钚: (地区战略资料.核反应堆 ?? {}) as Record<number, any>,
                };

                const 集合键 = 制取物 as keyof typeof 建筑集合映射;
                const 原始映射 = 建筑集合映射[集合键] ?? {};
                const 映射: Record<number, any> = { ...原始映射 };

                let 目标编号 = Number.isFinite(Number(建筑编号))
                    ? Math.max(1, Math.floor(Number(建筑编号) || 1))
                    : Math.max(
                          1,
                          ...Object.keys(映射).map((k) => Number(k) || 0)
                      ) + (Object.keys(映射).length ? 1 : 0);

                // 找一个空闲的建筑（未制备中）
                if (!Number.isFinite(Number(建筑编号))) {
                    const 空闲 = Object.entries(映射).find(
                        ([, v]) => !(v?.是否制备中 || v?.是否运行中)
                    );
                    if (空闲) {
                        目标编号 = Number(空闲[0]);
                    }
                }

                const 设施 = 映射[目标编号] ?? {
                    是否制备中: false,
                    建造进度: 0,
                    建造时间: '',
                };
                if (设施.是否制备中) {
                    return `建筑#${目标编号} 正在使用中，请选择空闲建筑`;
                }

                const cfg = (制取配置 as any)[制取物];
                const 资源消耗: Record<string, number> = cfg.资源消耗 ?? {};

                // 检查玩家资源
                for (const [key, need] of Object.entries(资源消耗)) {
                    const have = (用户资料 as any)[key] ?? 0;
                    if ((have ?? 0) < need) {
                        return `资源不足：需要 ${key}${格式化(need)}，你拥有 ${格式化(have)}`;
                    }
                }

                // 扣除资源
                const 玩家更新: Record<string, number> = {};
                for (const [key, need] of Object.entries(资源消耗)) {
                    (玩家更新 as any)[key] = (用户资料 as any)[key] - need;
                }

                // 标记制备中并写入日志
                const 时间 = dayjs().format('YYYY-MM-DD HH:mm');

                const 日志项 = {
                    制备者: username,
                    制备物: 制取物,
                    数量: cfg.产出数量,
                    时间,
                };

                映射[目标编号] = {
                    ...设施,
                    是否制备中: true,
                    建造时间: 时间,
                    日志: [...(设施?.日志 ?? []), 日志项],
                };

                // 保存到数据库
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
                    `■ 建筑目标：#${目标编号}`,
                    `■ 制取目标：${制取物} x${格式化(cfg.产出数量)}`,
                    `■ 消耗：${Object.entries(资源消耗)
                        .map(([k, v]) => `${k}${格式化(v)}`)
                        .join('、')}`,
                    `■ 制取开始时间：${时间}`,
                    `■ 预计需要：${格式化(cfg.所需小时)} 小时（系统会记录完成时间，需后台执行器完成）`,
                ].join('\n');
            } catch (error) {
                return (error as Error).message;
            }
        });
}
