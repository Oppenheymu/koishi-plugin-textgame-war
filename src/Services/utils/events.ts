import { EventEmitter } from "node:events";

export interface 服务事件映射 {
	"重置与调度:每日签到重置完成": {
		日期: string;
		重置玩家数量: number;
	};
	"重置与调度:每时生产重置完成": {
		重置玩家数量: number;
	};
	"生产与统计:全服统计完成": {
		日期: string;
		玩家数量: number;
		昨日全球生产总值: number;
	};
	"联军相关:资本日结完成": {
		日期: string;
		联军数量: number;
	};
}

type 事件名 = keyof 服务事件映射;

type 事件处理器<K extends 事件名> = (
	payload: 服务事件映射[K],
) => void | Promise<void>;

class 服务事件总线 {
	private readonly emitter = new EventEmitter();

	on<K extends 事件名>(event: K, handler: 事件处理器<K>) {
		this.emitter.on(event, handler as (...args: unknown[]) => void);
	}

	off<K extends 事件名>(event: K, handler: 事件处理器<K>) {
		this.emitter.off(event, handler as (...args: unknown[]) => void);
	}

	emit<K extends 事件名>(event: K, payload: 服务事件映射[K]) {
		this.emitter.emit(event, payload);
	}
}

export const 服务事件中心 = new 服务事件总线();
