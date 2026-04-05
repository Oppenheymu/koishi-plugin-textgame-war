export type Node = {
    next: Map<string, Node>;
    fail: Node | null;
    match: string | null;
};
