import * as vscode from "vscode";

export interface ChatResponseFormat {
    response: string;
    references: string[];
    thread_id: string;
}

export interface ChatHistoryItem {
    type: "HUMAN_MESSAGE" | "AI_MESSAGE";
    content: string;
}

export interface ChatRequest {
    message: string;
    history?: ChatHistoryItem[];
    files?: FileContent[];
}

export interface FileContent {
    content: string;
    file_name: string;
    reference: string;
}

export interface LoadFileRequest {
    codebase_name: string;
    file_path: string;
    file_content: string;
}

export interface FileReference {
    id: string;
    name: string;
    value: {
        fsPath: string;
        scheme: string;
    };
}
