'use strict';

import * as vscode from 'vscode';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import fetch from 'node-fetch';

const baseUrl = 'https://raw.githubusercontent.com/acharluk/easy-cpp-projects/master';

interface EasyFilesJSON {
    directories: string[];
    templates: { [name: string]: { [from: string]: string } };
}

export function activate(context: vscode.ExtensionContext) {
    let createProjectCommand = vscode.commands.registerCommand('easycpp.createProject', () => {
        fetch(baseUrl + '/templates/files.json')
            .then(res => res.json())
            .then(data => {
                let templates = [];
                for (let tname in data.templates) { templates.push(tname); }

                vscode.window.showQuickPick(templates)
                .then(selected => downloadTemplate(data, selected));
            })
            .catch(error => console.error("Easy C++ Projects error: Could not fetch 'files.json' from GitHub\nError: " + error));
    });

    context.subscriptions.push(createProjectCommand);
}

export function deactivate() {
}

function downloadTemplate(files: EasyFilesJSON, templateName: string | undefined): void {
    if (!templateName) { return; }

    files.directories.forEach((dir: string) => {
        if (!existsSync(vscode.workspace.rootPath + '/' + dir)) {
            mkdirSync(vscode.workspace.rootPath + '/' + dir);
        }
    });

    for (let file in files.templates[templateName]) {
        fetch(baseUrl + '/templates/' + "/" + file)
        .then(res => res.text())
        .then(data => {
            writeFileSync(vscode.workspace.rootPath + '/' + files.templates[templateName][file], data);
            if (files.templates[templateName][file] === 'src/main.cpp') {
                vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/src/main.cpp')
                .then(doc => vscode.window.showTextDocument(doc));
            }
        })
        .catch(error => console.error(`Easy C++ Projects error: Could not download '${file}' from GitHub\nError: ` + error));
    }
}