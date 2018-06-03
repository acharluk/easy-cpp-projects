'use strict';

import * as vscode from 'vscode';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import fetch from 'node-fetch';

const baseUrl = 'https://raw.githubusercontent.com/acharluk/easy-cpp-projects/master';

interface EasyProjectsJSON {
    directories: string[];
    templates: { [name: string]: { [from: string]: string } };
}

interface EasyClassesJSON {
    [className: string]: {
        [fileName: string]: {
            folder: string;
            extension: string;
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    let createProjectCommand = vscode.commands.registerCommand('easycpp.createProject', createProject);
    let createClassCommand = vscode.commands.registerCommand('easycpp.createClass', createClass);

    let buildButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    buildButton.command = 'workbench.action.tasks.build';
    buildButton.text = '⚙ Build';
    buildButton.tooltip = 'Build C++ Project (make) [Ctrl+F7]';
    buildButton.show();

    let buildAndRunButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    buildAndRunButton.command = 'workbench.action.tasks.test';
    buildAndRunButton.text = '▶ Build & Run';
    buildAndRunButton.tooltip = 'Build & Run C++ Project (make run) [F7]';
    buildAndRunButton.show();

    context.subscriptions.push(buildButton);
    context.subscriptions.push(buildAndRunButton);
    context.subscriptions.push(createProjectCommand);
    context.subscriptions.push(createClassCommand);
}

export function deactivate() {
}

const createClass = () => {
    fetch(baseUrl + '/templates/classes/files.json')
    .then(data => data.json())
    .then((templates: EasyClassesJSON) => {
        let template_files = [];
        for (let tname in templates) { template_files.push(tname); }

        vscode.window.showQuickPick(template_files)
        .then((selected: string | undefined) => {
            if (!selected) { return; }

            vscode.window.showInputBox({prompt: "Enter class name"})
            .then(val => {
                if (!val || !vscode.window.activeTextEditor) { return; }
                let currentFolderWorkspace = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
                if (!currentFolderWorkspace) { return; }

                const currentFolder = currentFolderWorkspace.uri.fsPath;
                for (let file in templates[selected]) {
                    fetch(`${baseUrl}/templates/classes/${selected}/${file}`)
                    .then(value => value.text())
                    .then(data => {
                        data = data.replace(new RegExp('easyclass', 'g'), val);
                        writeFileSync(`${currentFolder}/${templates[selected][file].folder}/${val}.${templates[selected][file].extension}`, data);

                        vscode.workspace.openTextDocument(`${currentFolder}/${templates[selected][file].folder}/${val}.${templates[selected][file].extension}`)
                        .then(doc => vscode.window.showTextDocument(doc));
                    })
                    .catch(error => vscode.window.showErrorMessage(`Easy C++ Error: ${error}`));
                }
            });
        });
    })
    .catch(error => vscode.window.showErrorMessage(`Easy C++ error: ${error}`));
};

const createProject = () => {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage("Open a folder or workspace before creating a project!");
        return;
    }
    fetch(baseUrl + '/templates/project/files.json')
    .then(res => res.json())
    .then(data => {
        let templates = [];
        for (let tname in data.templates) { templates.push(tname); }

        vscode.window.showQuickPick(templates)
        .then(selected => selectFolderAndDownload(data, selected))
        .then(() => {
            vscode.workspace.getConfiguration('files').update('associations', { "*.tpp":"cpp" }, vscode.ConfigurationTarget.Workspace);
        });
    })
    .catch(error => vscode.window.showErrorMessage("Easy C++ Projects error: Could not fetch 'files.json' from GitHub\nError: " + error));
};

function selectFolderAndDownload(files: EasyProjectsJSON, templateName: string | undefined): void {
    if (!templateName || !vscode.workspace.workspaceFolders) { return; }

    if (vscode.workspace.workspaceFolders.length > 1) {
        vscode.window.showWorkspaceFolderPick()
        .then(chosen => {
            if (!chosen) { return; }
            let folder = chosen.uri;
            downloadTemplate(files, templateName, folder.fsPath);
        });
    } else {
        downloadTemplate(files, templateName, vscode.workspace.workspaceFolders[0].uri.fsPath);
    }
}

function downloadTemplate(files: EasyProjectsJSON, templateName: string, folder: string): void {
    files.directories.forEach((dir: string) => {
        if (!existsSync(folder + '/' + dir)) {
            mkdirSync(folder + '/' + dir);
        }
    });

    for (let file in files.templates[templateName]) {
        fetch(baseUrl + '/templates/project/' + file)
        .then(res => res.text())
        .then(data => {
            writeFileSync(folder + '/' + files.templates[templateName][file], data);
            if (files.templates[templateName][file] === 'src/main.cpp') {
                vscode.workspace.openTextDocument(folder + '/src/main.cpp')
                .then(doc => vscode.window.showTextDocument(doc));
            }
        })
        .catch(error => vscode.window.showErrorMessage(`Easy C++ Projects error: Could not download '${file}' from GitHub\nError: ` + error));
    }
}