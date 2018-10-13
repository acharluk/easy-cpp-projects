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
    };
}

export function activate(context: vscode.ExtensionContext) {
    let createProjectCommand = vscode.commands.registerCommand('easycpp.createProject', createProject);
    let createClassCommand = vscode.commands.registerCommand('easycpp.createClass', createClass);
    let createGetterSetterCommand = vscode.commands.registerCommand('easycpp.createGetterSetter', createGetterSetter);
    let createGetterCommand = vscode.commands.registerCommand('easycpp.createGetter', createGetter);
    let createSetterCommand = vscode.commands.registerCommand('easycpp.createSetter', createSetter);

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
    context.subscriptions.push(createGetterSetterCommand);
    context.subscriptions.push(createGetterCommand);
    context.subscriptions.push(createSetterCommand);
}

export function deactivate() {
}

const createClass = async () => {
    try {
        const  data = await fetch(`${baseUrl}/templates/classes/files.json`);
        const templates: EasyClassesJSON = await data.json();
        const template_files = [];
        for (let tname in templates) { template_files.push(tname); }

        const selected = await vscode.window.showQuickPick(template_files);
        if (!selected) { return; }

        const val = await vscode.window.showInputBox({ prompt: `Enter class name` });
        if (!val || ! vscode.window.activeTextEditor) { return; }

        const currentFolderWorkspace = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        if (!currentFolderWorkspace) { return; }

        const currentFolder = currentFolderWorkspace.uri.fsPath;
        for (let file in templates[selected]) {
            const value = await fetch(`${baseUrl}/templates/classes/${selected}/${file}`);
            let data = await value.text();
            data = data.replace(new RegExp('easyclass', 'g'), val);
            writeFileSync(`${currentFolder}/${templates[selected][file].folder}/${val}.${templates[selected][file].extension}`, data);

            vscode.workspace.openTextDocument(`${currentFolder}/${templates[selected][file].folder}/${val}.${templates[selected][file].extension}`)
            .then(doc => vscode.window.showTextDocument(doc, { preview: false }));
        }
    } catch(err) {
        vscode.window.showErrorMessage(`Easy C++ error: ${err}`);
    }
};

const createProject = async () => {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage("Open a folder or workspace before creating a project!");
        return;
    }

    try {
        const res = await fetch(`${baseUrl}/templates/project/files.json`);
        const  data = await res.json();
        let templates = [];
        for (let tname in data.templates) { templates.push(tname); }

        const selected = await vscode.window.showQuickPick(templates);
        await selectFolderAndDownload(data, selected);
        vscode.workspace.getConfiguration('files').update('associations', { "*.tpp":"cpp" }, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('terminal.integrated.shell').update('windows', "cmd.exe", vscode.ConfigurationTarget.Workspace);
    } catch(error) {
        vscode.window.showErrorMessage(`Easy C++ Projects error: Could not fetch 'files.json' from GitHub\nError: ${error}`);
    }
};

const selectFolderAndDownload = async (files: EasyProjectsJSON, templateName: string | undefined) => {
    if (!templateName || !vscode.workspace.workspaceFolders) { return; }

    if (vscode.workspace.workspaceFolders.length > 1) {
        try {
            const chosen = await vscode.window.showWorkspaceFolderPick();
            if (!chosen) { return; }
            let folder = chosen.uri;
            await downloadTemplate(files, templateName, folder.fsPath);
        } catch(err) {
            vscode.window.showErrorMessage(`Easy C++ error: ${err}`);
        }

    } else {
        downloadTemplate(files, templateName, vscode.workspace.workspaceFolders[0].uri.fsPath);
    }
};

const downloadTemplate = async (files: EasyProjectsJSON, templateName: string, folder: string) => {
    files.directories.forEach((dir: string) => {
        if (!existsSync(`${folder}/${dir}`)) {
            mkdirSync(`${folder}/${dir}`);
        }
    });

    for (let file in files.templates[templateName]) {
        try {
            const res = await fetch(`${baseUrl}/templates/project/${file}`);
            const data = await res.text();
            writeFileSync(`${folder}/${files.templates[templateName][file]}`, data);
            if (files.templates[templateName][file] === 'src/main.cpp') {
                vscode.workspace.openTextDocument(`${folder}/src/main.cpp`)
                .then(doc => vscode.window.showTextDocument(doc, { preview: false }));
            }
        } catch(error) {
            vscode.window.showErrorMessage(`Easy C++ Projects error: Could not download '${file}' from GitHub\nError: ${error}`);
        }
    }
};


const createGetterSetter = (getter ?: boolean, setter ?: boolean) => {
    if (!getter && !setter) {
        getter = setter = true;
    }
    let editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const getterSnippet = (variableName: string, variableType: string) => { return new vscode.SnippetString(`
    ${variableType} get${variableName.charAt(0).toUpperCase() + variableName.substring(1)}() {
        return ${variableName};
    }
    `);};
    const setterSnippet = (variableName: string, variableType: string) => { return new vscode.SnippetString(`
    void set${variableName.charAt(0).toUpperCase() + variableName.substring(1)}(${variableType} ${variableName}) {
        this->${variableName} = ${variableName};
    }
    `);};

    let selection = editor.selection;
    let selectedText = editor.document.getText(new vscode.Range(selection.start, selection.end)).trim();

    let lines = selectedText.split('\n');

    let createData :{type: string, name: string}[] = [];

    for (let line of lines) {
        if(!/\s*\w+\s+[*]*\w+\s*(,\s*\w+\s*)*;+/.test(line)) {
            vscode.window.showErrorMessage(`Syntax error, cannot create getter or setter: ${line}`);
            return;
        }

        let type = line.search(/\w+\s+/);
        let firstSpace = line.indexOf(' ', type);

        let vType = line.substring(type, firstSpace).trim();
        line = line.substring(firstSpace).trim();
        let vNames = line.replace(' ', '').replace(';', '').split(',');

        vNames.forEach(e => {
            while (e.includes('*')) {
                e = e.replace('*', '');
                vType += '*';
            }
            createData.push({ type: vType, name: e });
        });
    }

    for (let e of createData) {
        if (getter) { editor.insertSnippet(getterSnippet(e.name, e.type), new vscode.Position(selection.end.line+1, 0)); }
        if (setter) { editor.insertSnippet(setterSnippet(e.name, e.type), new vscode.Position(selection.end.line+1, 0)); }
    }
};

const createGetter = () => createGetterSetter(true, false);
const createSetter = () => createGetterSetter(false, true);