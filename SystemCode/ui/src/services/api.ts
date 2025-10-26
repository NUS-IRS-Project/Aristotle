import { ChatRequest, LoadFileRequest, ChatResponseFormat } from "../types/api";
import * as vscode from "vscode";

const api_base_url =
    vscode.workspace.getConfiguration("aristotle").get("api_base_url") ||
    "http://localhost:8000";
console.log("[INFO] server base url:", api_base_url);
const timeout_ms = 30 * (60 * 1000);

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public errorDetails?: string,
    ) {
        super(message);
        this.name = "ApiError";
    }

    toString() {
        return this.errorDetails
            ? `${this.message}: ${this.errorDetails}`
            : this.message;
    }
}

async function makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST",
    data?: any,
): Promise<T> {
    const response = await fetch(`${api_base_url}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(timeout_ms),
    });

    const jsonResponse = (await response.json()) as T;

    if (!response.ok) {
        // @ts-ignore
        const errorMessage = jsonResponse.error;
        throw new ApiError(response.status, errorMessage);
    }

    return jsonResponse;
}

export async function sendChatRequest(
    data: ChatRequest,
): Promise<ChatResponseFormat> {
    return makeRequest<ChatResponseFormat>("/chat", "POST", data);
}

export async function loadWorkspaceFile(data: LoadFileRequest): Promise<void> {
    return makeRequest<void>("/load", "POST", data);
}
