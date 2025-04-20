import * as vscode from "vscode";
import * as path from "path";
import {
	promptForMFEName,
	getWorkspaceRoot,
	createDirectory,
	createIndexFile,
	createSvelteFile,
	updateManifestFile,
	updateRoutesFile,
	createTrackerFile,
} from "./utils";

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand(
		"mf-generator.createMicroFrontend",
		async () => {
			const mfName = await promptForMFEName();
			if (!mfName) {
				return;
			}

			const workspaceRoot = getWorkspaceRoot();
			if (!workspaceRoot) {
				return;
			}

			try {
				// Create the micro-frontend directory
				const mfPath = path.join(workspaceRoot, "src", "apps", mfName);
				await createDirectory(mfPath);

				// Create index.ts file
				await createIndexFile(mfName, mfPath);

				// Create _[mfname].svelte file
				await createSvelteFile(mfName, mfPath);

				// Create _tracker.svelte file
				await createTrackerFile(mfName, mfPath);

				// Update routes.ts
				await updateRoutesFile(workspaceRoot, mfName);
                
				// Update manifest.ts
				await updateManifestFile(workspaceRoot, mfName);
                
				vscode.window.showInformationMessage(
					`Successfully created ${mfName} micro-frontend!`
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Error creating micro-frontend: ${
						error instanceof Error ? error.message : String(error)
					}`
				);
			}
		}
	);

	context.subscriptions.push(disposable);
}

export function deactivate() {}
