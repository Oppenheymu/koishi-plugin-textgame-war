import dayjs from 'dayjs';

export function 获取今天日期(): string {
    return dayjs().format('YYYY-MM-DD');
}

export function 格式化日期(时间: Date): string {
    return `${时间.getFullYear()}-${String(时间.getMonth() + 1).padStart(2, '0')}-${String(
        时间.getDate()
    ).padStart(2, '0')}`;
}

export function 格式化数值(n: number): string {
    return n.toLocaleString('zh-CN');
}
