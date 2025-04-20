import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export async function promptForMFEName(): Promise<string | undefined> {
	const defaultValue = "MFE";
	return await vscode.window.showInputBox({
		placeHolder: "Enter micro-frontend name (e.g., MFETemplate)",
		value: defaultValue,
		prompt: "Name of the new micro-frontend",
		valueSelection: [defaultValue.length, defaultValue.length],
		validateInput: (value: string) => {
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
}

export function getWorkspaceRoot(): string | undefined {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage("No workspace folder is open");
		return undefined;
	}
	return workspaceFolders[0].uri.fsPath;
}

export function createDirectory(dirPath: string): void {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

export async function createIndexFile(
	mfName: string,
	mfPath: string
): Promise<void> {
	const indexFilePath = path.join(mfPath, "index.ts");
	const content = `import { exposeApp } from '@ozon-ob-foundation/mfe';

import AppEntry from '$components/AppEntry.svelte';

import ${mfName} from './_${mfName}.svelte';

export default exposeApp({ component: ${mfName}, entry: AppEntry });
`;

	fs.writeFileSync(indexFilePath, content);
	await formatFile(indexFilePath);
}

export async function createSvelteFile(
	mfName: string,
	mfPath: string
): Promise<void> {
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
	await formatFile(svelteFilePath, true);
}

export async function createTrackerFile(
	mfName: string,
	mfPath: string
): Promise<void> {
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
	await formatFile(trackerFilePath);
}

export async function updateManifestFile(
	workspaceRoot: string,
	mfName: string
): Promise<void> {
	const manifestPath = path.join(workspaceRoot, "src", "manifest.ts");
	if (!fs.existsSync(manifestPath)) {
		vscode.window.showErrorMessage("manifest.ts file not found in src/");
		return;
	}

	let content = fs.readFileSync(manifestPath, "utf8");

	// Find the last entry in the manifest
	const lastEntryIndex = content.lastIndexOf(
		"} satisfies MicroFrontend.Manifest;"
	);

	// Insert new entry before the closing brace
	const newEntry = `\t${mfName}: async () =>
        import('$apps/${mfName}/index').then((r) => r.default),
`;

	content =
		content.substring(0, lastEntryIndex) +
		newEntry +
		content.substring(lastEntryIndex);

	fs.writeFileSync(manifestPath, content);
	await formatFile(manifestPath);
}

export async function updateRoutesFile(
	workspaceRoot: string,
	mfName: string
): Promise<void> {
	const routesPath = path.join(workspaceRoot, "tests", "helpers", "routes.ts");
	if (!fs.existsSync(routesPath)) {
		vscode.window.showErrorMessage(
			"routes.ts file not found in tests/helpers/"
		);
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
	await formatFile(routesPath);
}

async function formatFile(filePath: string, show: boolean = false) {
	const uri = vscode.Uri.file(filePath);

	try {
		const document = await vscode.workspace.openTextDocument(uri);
		if (show) {
			await vscode.window.showTextDocument(document);
		}

		const formattingEdits: vscode.TextEdit[] | undefined =
			await vscode.commands.executeCommand(
				"vscode.executeFormatDocumentProvider",
				uri
			);

		if (!formattingEdits || formattingEdits.length === 0) {
			return; // No formatting changes needed
		}

		const workspaceEdit = new vscode.WorkspaceEdit();
		workspaceEdit.set(uri, formattingEdits);

		const success = await vscode.workspace.applyEdit(workspaceEdit);
		if (success) {
			await document.save(); // Save after formatting
		}

		return success;
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to format file: ${error}`);
		return false;
	}
}
