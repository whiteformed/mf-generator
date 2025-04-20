"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const utils_1 = require("./utils");
function activate(context) {
    let disposable = vscode.commands.registerCommand("mf-generator.createMicroFrontend", () => __awaiter(this, void 0, void 0, function* () {
        const mfName = yield (0, utils_1.promptForMFEName)();
        if (!mfName) {
            return;
        }
        const workspaceRoot = (0, utils_1.getWorkspaceRoot)();
        if (!workspaceRoot) {
            return;
        }
        try {
            // Create the micro-frontend directory
            const mfPath = path.join(workspaceRoot, "src", "apps", mfName);
            yield (0, utils_1.createDirectory)(mfPath);
            // Create index.ts file
            yield (0, utils_1.createIndexFile)(mfName, mfPath);
            // Create _[mfname].svelte file
            yield (0, utils_1.createSvelteFile)(mfName, mfPath);
            // Create _tracker.svelte file
            yield (0, utils_1.createTrackerFile)(mfName, mfPath);
            // Update routes.ts
            yield (0, utils_1.updateRoutesFile)(workspaceRoot, mfName);
            // Update manifest.ts
            yield (0, utils_1.updateManifestFile)(workspaceRoot, mfName);
            vscode.window.showInformationMessage(`Successfully created ${mfName} micro-frontend!`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error creating micro-frontend: ${error instanceof Error ? error.message : String(error)}`);
        }
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map