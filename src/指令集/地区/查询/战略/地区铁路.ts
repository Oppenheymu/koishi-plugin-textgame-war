import type { Context } from 'koishi';
import { 获取铁路类型列表 } from '@/logic';
import { 地区查询权限检查 } from '@/utils';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');

const 铁路类型名称映射 = new Map(
    获取铁路类型列表().map((配置) => [配置.类型ID, 配置.类型名称] as const)
);

export function 查看地区铁路(ctx: Context) {
    ctx.command('查看地区铁路 [地区编号:string]')
        .alias('查看城市铁路')
        .alias('铁路运输')
        .alias('地区铁路')
        .alias('城市铁路')
        .action(async ({ session }, 地区编号参数) => {
            try {
                const { 地区编号, 地区战略资料, 展示地区名称 } = await 地区查询权限检查(
                    ctx,
                    session,
                    '查看地区铁路',
                    地区编号参数
                );

                const 铁路列表 = Object.entries(地区战略资料.铁路 ?? {});

                const 铁路展示 = 铁路列表.length
                    ? 铁路列表
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([编号, 铁路信息]) => {
                              const 负载占比 =
                                  铁路信息.铁路运力 > 0
                                      ? `${((铁路信息.当前负载 / 铁路信息.铁路运力) * 100).toFixed(1)}%`
                                      : '0%';
                              const 最近日志 =
                                  (铁路信息.铁路日志 ?? [])
                                      .slice(0, 2)
                                      .map(
                                          (日志) =>
                                              `      · ${日志.时间}，${日志.运输者} 运输 ${日志.运输物}`
                                      )
                                      .join('\n') || '      · 暂无运输记录';

                              return [
                                  `  - 铁路#${编号}`,
                                  `    · 目标地区：${铁路信息.目标地区}`,
                                  `    · 类型：${铁路类型名称映射.get(铁路信息.铁路类型) || 铁路信息.铁路类型 || '未知类型'}`,
                                  `    · 状态：${铁路信息.铁路状态}`,
                                  `    · 建造进度：${(铁路信息.建造进度 ?? 0).toFixed(2)}%`,
                                  `    · 运力：${格式化(铁路信息.当前负载)} / ${格式化(铁路信息.铁路运力)} (${负载占比})`,
                                  `    · 开通时间：${铁路信息.开通时间 || '未开通'}`,
                                  '    · 最近运输：',
                                  最近日志,
                              ].join('\n');
                          })
                          .join('\n')
                    : '  - 暂无铁路记录';

                return [
                    '【地区铁路】',
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 司令：${地区战略资料.地区司令 || '暂无'}`,
                    `■ 铁路数量：${铁路列表.length}`,
                    '□ 铁路详情：',
                    铁路展示,
                ].join('\n');
            } catch (error) {
                return (error as Error).message;
            }
        });
}
