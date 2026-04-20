import type { Context } from 'koishi';
import { 地区解析, 当前地区解析 } from '@/utils';
import { 地区编号转经纬度, 格式化经纬度 } from '@/地理集';

const 格式化 = (n: number) => n.toLocaleString('zh-CN');

const 去尾零 = (value: string) => value.replace(/\.0$/, '');

const 紧凑数值 = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1e8) return `${去尾零((n / 1e8).toFixed(1))}亿`;
    if (abs >= 1e4) return `${去尾零((n / 1e4).toFixed(1))}万`;
    return 格式化(n);
};

const 百分比 = (已用: number, 上限: number) =>
    上限 > 0 ? `${((已用 / 上限) * 100).toFixed(1)}%` : '0%';

const 格式化容量 = (当前值: number, 已用值: number, 上限值: number) =>
    `${紧凑数值(当前值)} / ${紧凑数值(上限值)} (${百分比(已用值, 上限值)})`;

const 容量配置 = [
    {
        标签: '基建',
        当前字段: '当前总基础设施',
        已用字段: '使用的基础设施',
        上限字段: '基础设施上限',
    },
    {
        标签: '机场',
        当前字段: '当前总机场容量',
        已用字段: '使用的机场容量',
        上限字段: '机场容量上限',
    },
    {
        标签: '公路',
        当前字段: '当前总公路容量',
        已用字段: '使用的公路容量',
        上限字段: '公路容量上限',
    },
    {
        标签: '居民',
        当前字段: '当前总居民区容量',
        已用字段: '使用的居民区容量',
        上限字段: '居民区容量上限',
    },
    {
        标签: '仓储',
        当前字段: '当前总仓库容量',
        已用字段: '使用的仓库容量',
        上限字段: '仓库容量上限',
    },
    {
        标签: '港口',
        当前字段: '当前总港口容量',
        已用字段: '使用的港口容量',
        上限字段: '港口容量上限',
    },
] as const;

export function 查看地区(ctx: Context) {
    ctx.command('查看地区 [地区编号:string]')
        .alias('查看城市')
        .action(async ({ session }, 地区编号参数) => {
            try {
                const 规范地区编号 = 地区编号参数?.trim();
                const { 地区编号, 地区资料, 展示地区名称 } = 规范地区编号
                    ? await 地区解析(ctx, 规范地区编号)
                    : await 当前地区解析(ctx, session);

                const 容量行 = 容量配置.map(
                    ({ 标签, 当前字段, 已用字段, 上限字段 }) => {
                        const 当前 = 地区资料[
                            当前字段 as keyof typeof 地区资料
                        ] as number;
                        const 已用 = 地区资料[
                            已用字段 as keyof typeof 地区资料
                        ] as number;
                        const 上限 = 地区资料[
                            上限字段 as keyof typeof 地区资料
                        ] as number;
                        return `· ${标签}: ${格式化容量(当前, 已用, 上限)}`;
                    }
                );

                const 经纬度 = 地区编号转经纬度(地区编号);

                return [
                    `【城市情报】`,
                    展示地区名称,
                    `■ 地区编号：${地区编号}`,
                    `■ 坐标：`,
                    `(${地区资料.栅格X}, ${地区资料.栅格Y}) ${格式化经纬度(经纬度)}`,
                    `■ 地区地形：${地区资料.地区地形}`,
                    `□ 归属联军：${地区资料.控制国家?.trim() || '无'}`,
                    `□ 地区总督：${地区资料.地区总督 || '暂无'}`,
                    ...容量行,
                    `■ 炼钢厂: ${格式化(地区资料.炼钢厂数量)}`,
                    `■ 电解铝厂: ${格式化(地区资料.电解铝厂数量)}`,
                ].join('\n');
            } catch (error) {
                return (error as Error).message;
            }
        });
}
