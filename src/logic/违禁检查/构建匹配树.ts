type Node = {
	next: Map<string, Node>;
	fail: Node | null;
	match: string | null;
};

export const build = (words: readonly string[]): Node => {
	const root: Node = {
		next: new Map(),
		fail: null,
		match: null,
	};

	for (const w of words) {
		let p = root;
		for (const ch of w) {
			let nextNode = p.next.get(ch);
			if (!nextNode) {
				nextNode = {
					next: new Map(),
					fail: null,
					match: null,
				};
				p.next.set(ch, nextNode);
			}
			p = nextNode;
		}
		p.match = w;
	}

	const q: Node[] = [];
	let head = 0;

	for (const c of root.next.values()) {
		c.fail = root;
		q.push(c);
	}

	while (head < q.length) {
		const cur = q[head++];
		for (const [ch, nx] of cur.next) {
			let f = cur.fail;
			while (f && !f.next.has(ch)) {
				f = f.fail;
			}
			nx.fail = f ? f.next.get(ch)! : root;
			nx.match = nx.match ?? nx.fail.match;
			q.push(nx);
		}
	}

	return root;
};
