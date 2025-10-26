import * as vscode from "vscode";
import { sendChatRequest } from "../services/api";
import {
    ChatRequest,
    ChatHistoryItem,
    FileReference,
    FileContent,
} from "../types/api";
import { handleLoadWorkspace } from "./workspace";

export async function handleChatRequest(
    request: vscode.ChatRequest,
    chatContext: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.progress("Working on it...");

    const parts = request.prompt.trim().split(/\s+/);
    if (parts.length > 0 && parts[0] === "/load_cwd") {
        if (parts.length !== 2) {
            stream.markdown(
                "❌ Invalid usage. Please provide exactly one argument: `/loadWorkspace <codebase_name>`",
            );
            return;
        }
        const codebaseName = parts[1].trim();
        if (!codebaseName) {
            stream.markdown(
                "❌ Invalid usage. Please provide exactly one argument: `/loadWorkspace <codebase_name>`",
            );
            return;
        }
        await handleLoadWorkspace(codebaseName, stream, token);
        return;
    }

    try {
        const filteredHistory = chatContext.history
            .filter((turn) => turn.participant === "aristotle-ui.chat")
            .map((turn): ChatHistoryItem => {
                if (turn instanceof vscode.ChatRequestTurn) {
                    return {
                        type: "HUMAN_MESSAGE" as const,
                        content: turn.prompt,
                    };
                } else {
                    return {
                        type: "AI_MESSAGE" as const,
                        content: turn.response
                            .filter(
                                (part) =>
                                    part instanceof
                                    vscode.ChatResponseMarkdownPart,
                            )
                            .map((part) => {
                                const md = (
                                    part as vscode.ChatResponseMarkdownPart
                                ).value as vscode.MarkdownString;
                                return md.value;
                            })
                            .join(""),
                    };
                }
            });

        const fileContents = await getFileContents(
            request.references,
            stream,
            token,
        );

        const requestBody: ChatRequest = {
            message: request.prompt,
            history: filteredHistory,
            files: fileContents.length > 0 ? fileContents : undefined,
        };
        console.log(fileContents);

        console.log("[INFO] Sending:", requestBody);
        const response = await sendChatRequest(requestBody);
        console.log("[INFO] Chat response:", response);

        if (response.response) {
            stream.markdown(response.response);
            if (response.references && response.references.length > 0) {
                stream.markdown(
                    "\n\n**References:**\n" +
                        response.references.map((ref) => `- ${ref}`).join("\n"),
                );
            }
        } else {
            stream.markdown("❌ No response from server.");
        }
    } catch (err: any) {
        stream.markdown(`❌ Error while asking: ${err.message}`);
    }
}

async function getFileContents(
    references: readonly any[] | undefined,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
) {
    const fileContents: FileContent[] = [];

    if (references && references.length > 0) {
        for (const ref of references) {
            const fileRef = ref as unknown as FileReference;

            if (
                fileRef.value &&
                fileRef.value.scheme === "file" &&
                !fileRef.name.includes("copilot-instructions.md")
            ) {
                if (token.isCancellationRequested) {
                    break;
                }

                stream.progress(`Reading context file ${fileRef.name}...`);

                try {
                    const uri = vscode.Uri.file(fileRef.value.fsPath);
                    const fileData = await vscode.workspace.fs.readFile(uri);
                    const content = Buffer.from(fileData).toString("utf8");

                    fileContents.push({
                        content,
                        file_name: fileRef.name,
                        reference: fileRef.value.fsPath,
                    });
                } catch (fileErr) {
                    console.error(
                        `Error reading file ${fileRef.name}:`,
                        fileErr,
                    );
                }
            }
        }
    }

    if (fileContents.length) {
        stream.progress(`Working on it...`);
    }

    return fileContents;
}
