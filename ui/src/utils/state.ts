import globals from "../global";

function getThreadId(): string | undefined {
    return globals.extensionContext?.workspaceState.get<string>("thread_id");
}

function updateThreadId(threadId: string) {
    globals.extensionContext?.workspaceState.update("thread_id", threadId);
}

export { getThreadId, updateThreadId };
