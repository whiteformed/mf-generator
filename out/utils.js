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
exports.updateRoutesFile = exports.updateManifestFile = exports.createTrackerFile = exports.createSvelteFile = exports.createIndexFile = exports.createDirectory = exports.getWorkspaceRoot = exports.promptForMFEName = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
function promptForMFEName() {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultValue = "MFE";
        return yield vscode.window.showInputBox({
            placeHolder: "Enter micro-frontend name (e.g., MFETemplate)",
            value: defaultValue,
            prompt: "Name of the new micro-frontend",
            valueSelection: [defaultValue.length, defaultValue.length],
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return "It cannot be empty";
                }
                if (!value.startsWith(defaultValue)) {
                    return "It must start with 'MFE'";
                }
                if (value === defaultValue) {
                    return "It must include something besides MFE";
                }
                const mfName = value.replace(defaultValue, "");
                if (!/^[A-Z][A-Za-z]*$/.test(mfName)) {
                    return "It must be written in PascalCase";
                }
                return null;
            },
        });
    });
}
exports.promptForMFEName = promptForMFEName;
function getWorkspaceRoot() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder is open");
        return undefined;
    }
    return workspaceFolders[0].uri.fsPath;
}
exports.getWorkspaceRoot = getWorkspaceRoot;
function createDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
exports.createDirectory = createDirectory;
function createIndexFile(mfName, mfPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const indexFilePath = path.join(mfPath, "index.ts");
        const content = `import { exposeApp } from '@ozon-ob-foundation/mfe';

import AppEntry from '$components/AppEntry.svelte';

import ${mfName} from './_${mfName}.svelte';

export default exposeApp({ component: ${mfName}, entry: AppEntry });
`;
        fs.writeFileSync(indexFilePath, content);
        yield formatFile(indexFilePath);
    });
}
exports.createIndexFile = createIndexFile;
function createSvelteFile(mfName, mfPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const svelteFilePath = path.join(mfPath, `_${mfName}.svelte`);
        const mfNameKebabized = mfName
            .replace("MFE", "")
            .replace(/([a-z])([A-Z])/g, "$1-$2")
            .toLowerCase();
        const content = `<script lang="ts">
    import type { MFELinksContract } from '@ozon-ob-foundation/mfe-contracts';
    import { trackMount } from '@ozon-ob-foundation/tracker';

    import { initLinksStore } from '$stores/getLinksStore.svelte';

    import { tracker } from './_tracker';

    interface Props {
        links: MFELinksContract;
    }

    let { links }: Props = $props();

    trackMount(tracker.page_view.page);

    initLinksStore(links);
</script>

<div class="${mfNameKebabized}-page-container"></div>

<style lang="scss">
    .${mfNameKebabized}-page-container {
        background-color: var(--layerFloor0);
    }
</style>
`;
        fs.writeFileSync(svelteFilePath, content);
        yield formatFile(svelteFilePath, true);
    });
}
exports.createSvelteFile = createSvelteFile;
function createTrackerFile(mfName, mfPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const pageName = mfName.replace("MFE", "");
        const trackerFilePath = path.join(mfPath, "_tracker.ts");
        const content = `import { trackBlock } from '@ozon-ob-foundation/tracker';

export const BLOCK_NAME = '${pageName}Page';

export const tracker = trackBlock(BLOCK_NAME, {
    page_view: {
        page: 'ViewPage',
    },
});
`;
        fs.writeFileSync(trackerFilePath, content);
        yield formatFile(trackerFilePath);
    });
}
exports.createTrackerFile = createTrackerFile;
function updateManifestFile(workspaceRoot, mfName) {
    return __awaiter(this, void 0, void 0, function* () {
        const manifestPath = path.join(workspaceRoot, "src", "manifest.ts");
        if (!fs.existsSync(manifestPath)) {
            vscode.window.showErrorMessage("manifest.ts file not found in src/");
            return;
        }
        let content = fs.readFileSync(manifestPath, "utf8");
        // Find the last entry in the manifest
        const lastEntryIndex = content.lastIndexOf("} satisfies MicroFrontend.Manifest;");
        // Insert new entry before the closing brace
        const newEntry = `\t${mfName}: async () =>
        import('$apps/${mfName}/index').then((r) => r.default),
`;
        content =
            content.substring(0, lastEntryIndex) +
                newEntry +
                content.substring(lastEntryIndex);
        fs.writeFileSync(manifestPath, content);
        yield formatFile(manifestPath);
    });
}
exports.updateManifestFile = updateManifestFile;
function updateRoutesFile(workspaceRoot, mfName) {
    return __awaiter(this, void 0, void 0, function* () {
        const routesPath = path.join(workspaceRoot, "tests", "helpers", "routes.ts");
        if (!fs.existsSync(routesPath)) {
            vscode.window.showErrorMessage("routes.ts file not found in tests/helpers/");
            return;
        }
        let content = fs.readFileSync(routesPath, "utf8");
        // Find the last entry in the enum
        const lastEntryIndex = content.lastIndexOf("}");
        // Insert new entry before the closing brace
        const newEntry = `\t${mfName} = \`\${MFPlayground}/${mfName}\`,`;
        content =
            content.substring(0, lastEntryIndex) +
                newEntry +
                "\n" +
                content.substring(lastEntryIndex);
        fs.writeFileSync(routesPath, content);
        yield formatFile(routesPath);
    });
}
exports.updateRoutesFile = updateRoutesFile;
function formatFile(filePath, show = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const uri = vscode.Uri.file(filePath);
        try {
            const document = yield vscode.workspace.openTextDocument(uri);
            if (show) {
                yield vscode.window.showTextDocument(document);
            }
            const formattingEdits = yield vscode.commands.executeCommand("vscode.executeFormatDocumentProvider", uri);
            if (!formattingEdits || formattingEdits.length === 0) {
                return; // No formatting changes needed
            }
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.set(uri, formattingEdits);
            const success = yield vscode.workspace.applyEdit(workspaceEdit);
            if (success) {
                yield document.save(); // Save after formatting
            }
            return success;
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to format file: ${error}`);
            return false;
        }
    });
}
//# sourceMappingURL=utils.js.map