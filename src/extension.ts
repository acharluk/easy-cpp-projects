'use strict';

import * as vscode from 'vscode';
import { mkdirSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';

const baseUrl = 'https://raw.githubusercontent.com/acharluk/easy-cpp-projects/master';

interface CppProject {
    directories: string[];
    download: string[];
}

export function activate(context: vscode.ExtensionContext) {

    let createProjectCommand = vscode.commands.registerCommand('easycpp.createProject', () => {
        fetch(baseUrl + '/cpp/files.json')
        .then(res => res.json())
        .then((files: CppProject) => {
            files.directories.forEach((dir: string) => {
                mkdirSync(vscode.workspace.rootPath + '/' + dir);
            });

            files.download.forEach((file: string) => {
                fetch(baseUrl + '/cpp/template/' + file)
                .then(res => res.text())
                .then(data => {
                    writeFileSync(vscode.workspace.rootPath + '/' + file, data);
                    if (file === 'src/main.cpp') {
                        vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/src/main.cpp')
                        .then(doc => vscode.window.showTextDocument(doc));
                    }
                });
            });
        });
    });

    context.subscriptions.push(createProjectCommand);
}

export function deactivate() {
}