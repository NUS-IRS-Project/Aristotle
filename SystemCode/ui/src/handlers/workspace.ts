import * as vscode from "vscode";
import * as path from "path";
import { loadWorkspaceFile } from "../services/api";
import { ApiError } from "../services/api";

export async function handleLoadWorkspace(
    codebaseName: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            stream.markdown("❌ No workspace folder open.");
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        stream.progress(`📂 Loading files for codebase: **${codebaseName}**`);

        const files = await vscode.workspace.findFiles(
            "**/*.{py,md}",
            "{**/node_modules/**,**/.venv/**}",
            undefined,
            token,
        );

        if (files.length === 0) {
            stream.markdown("⚠️ No .py or .md files found in the workspace.");
            return;
        }

        let successCount = 0;
        let failCount = 0;

        const uploadPromises = files.map(async (file) => {
            if (token.isCancellationRequested) {
                return;
            }

            const relativePath = path.relative(rootPath, file.fsPath);

            try {
                const fileData = await vscode.workspace.fs.readFile(file);
                const content = Buffer.from(fileData).toString("utf8");

                const response = await loadWorkspaceFile({
                    codebase_name: codebaseName,
                    file_path: relativePath,
                    file_content: content,
                });

                stream.progress(`✅ Successfully loaded *${relativePath}*`);
                successCount++;
            } catch (error) {
                if (error instanceof ApiError) {
                    stream.progress(
                        `⚠️ Failed to load *${relativePath}*: ${error.message}`,
                    );
                } else {
                    stream.progress(
                        `⚠️ Error loading *${relativePath}*: ${
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }`,
                    );
                }
                failCount++;
            }
        });

        await Promise.all(uploadPromises);

        stream.markdown(
            `**Summary:**
- ✅ Successfully loaded: ${successCount}
- ⚠️ Failed to load: ${failCount}
- 📊 Total files loaded: ${files.length}`,
        );
    } catch (err: any) {
        stream.markdown(`❌ Error loading codebase: ${err.message}`);
    }
}
