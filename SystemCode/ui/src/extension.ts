import * as vscode from "vscode";
import { handleChatRequest } from "./handlers/chat";
import globals from "./global";

export function activate(context: vscode.ExtensionContext) {
    console.log("[INFO] Aristotle activated");

    globals.extensionContext = context;

    const disposable = vscode.commands.registerCommand(
        "aristotle-ui.helloWorld",
        () => {
            vscode.window.showInformationMessage("Hello World from Aristotle!");
        },
    );
    context.subscriptions.push(disposable);

    const chatParticipant = vscode.chat.createChatParticipant(
        "aristotle-ui.chat",
        handleChatRequest,
    );
    chatParticipant.iconPath = vscode.Uri.joinPath(
        context.extensionUri,
        "media",
        "aristotle.png",
    );
    context.subscriptions.push(chatParticipant);
}

export function deactivate() {}
