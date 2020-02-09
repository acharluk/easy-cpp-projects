'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import fetch from 'node-fetch';
import { spawn } from "child_process";

const baseUrl = 'https://raw.githubusercontent.com/acharluk/easy-cpp-projects/master';

const customTemplatesFolder = (() => {
    let e = vscode.extensions.getExtension('ACharLuk.easy-cpp-projects');
    if (!e) { return ''; }

    let dir = `${e.extensionPath}\\..\\easycpp_custom_templates`;
    if (os.type() !== 'Windows_NT') {
        dir = `${e.extensionPath}/../easycpp_custom_templates`;
    }

    if (!existsSync(dir)) {
        try {
            mkdirSync(dir);
            writeFileSync(`${dir}/files.json`, `{
    "templates": {
        "Example Custom Template": {
            "directories": [
                "ExampleDirectory"
            ],
            "blankFiles": [
                "HelloWorld.txt"
            ],
            "openFiles": [
                "HelloWorld.txt"
            ]
        }
    }
}`);
        } catch (err) {
            console.error(err);
        }
    }

    return dir;
})();

interface EasyProjectsJSON {
    version: string;
    directories?: string[];
    templates: {
        [templateName: string]: {
            directories?: [string];
            blankFiles?: [string];
            files?: { [from: string]: string };
            openFiles?: [string];
        };
    };
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
    let openCustomTemplateCommand = vscode.commands.registerCommand('easycpp.openCustomDir', openCustomDir);
    let convertToEasyProjectCommand = vscode.commands.registerCommand('easycpp.convertToEasyProject', convertToEasyProject);

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
    context.subscriptions.push(openCustomTemplateCommand);
    context.subscriptions.push(convertToEasyProjectCommand);
}

export function deactivate() {
}

const convertToEasyProject = () => {
    let wpath = vscode.workspace.workspaceFolders;
    if (!wpath) {
        vscode.window.showErrorMessage(`A directory must be opened to run this command!`);
        return;
    }

    let path = wpath[0].uri.fsPath;
    if (!existsSync(`${path}/.vscode`)) {
        mkdirSync(`${path}/.vscode`);
    }
    writeFileSync(`${path}/.vscode/.easycpp`, 'This file is created by Easy C++ Projects, please ignore and do not delete it');
};

const openCustomDir = () => {
    let dir = customTemplatesFolder;

    const currentOs = os.type();
    if (currentOs === 'Linux') {
        spawn('xdg-open', [`${dir}`]); // /out/templates/custom
    } else if (currentOs === 'Darwin') {
        spawn('open', [`${dir}`]);  // /out/templates/custom
    } else if (currentOs === 'Windows_NT') {
        spawn('explorer', [`${dir}`]); // \\out\\templates\\custom
    }
};

const createClass = async () => {
    try {
        const data = await fetch(`${baseUrl}/templates/classes/files.json`);
        const templates: EasyClassesJSON = await data.json();
        const template_files = [];
        for (let tname in templates) { template_files.push(tname); }

        const selected = await vscode.window.showQuickPick(template_files);
        if (!selected) { return; }

        const val = await vscode.window.showInputBox({ prompt: `Enter class name` });
        if (!val || !vscode.window.activeTextEditor) { return; }

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
    } catch (err) {
        vscode.window.showErrorMessage(`Easy C++ error: ${err}`);
    }
};

const createProject = async (local?: boolean) => {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage("Open a folder or workspace before creating a project!");
        return;
    }
    let templates = [];

    try {
        let data;
        if (local) {
            const res = readFileSync(`${__dirname}/templates/project/files.json`);
            data = JSON.parse(res.toString());
        } else {
            //? probably must add new template on server
            const res = await fetch(`${baseUrl}/templates/project/files.json`);
            data = await res.json();
        }

        for (let tname in data.templates) { templates.push(tname); }
        templates.push("Custom templates");

        const selected = await vscode.window.showQuickPick(templates);
        if (selected === "Custom templates") {
            const res = readFileSync(`${customTemplatesFolder}/files.json`);
            const data = JSON.parse(res.toString());
            templates = [];
            for (let tname in data.templates) { templates.push(tname); }

            const selected = await vscode.window.showQuickPick(templates);
            await selectFolderAndDownload(data, selected, true, true);
            vscode.workspace.getConfiguration('files').update('associations', { "*.tpp": "cpp" }, vscode.ConfigurationTarget.Workspace);
            vscode.workspace.getConfiguration('terminal.integrated.shell').update('windows', "cmd.exe", vscode.ConfigurationTarget.Workspace);
        } else {
            await selectFolderAndDownload(data, selected, local);
            vscode.workspace.getConfiguration('files').update('associations', { "*.tpp": "cpp" }, vscode.ConfigurationTarget.Workspace);
            vscode.workspace.getConfiguration('terminal.integrated.shell').update('windows', "cmd.exe", vscode.ConfigurationTarget.Workspace);
        }
    } catch (error) {
        if (local) {
            vscode.window.showErrorMessage(`Easy C++ Projects error: Could not load 'files.json' locally.\nError: ${error}`);
        } else {
            vscode.window.showWarningMessage(`Easy C++ Projects error: Could not fetch 'files.json' from GitHub, using local files.\nError: ${error}`);
            createProject(true);
        }
    }
};

const selectFolderAndDownload = async (files: EasyProjectsJSON, templateName: string | undefined, local?: boolean, custom?: boolean) => {
    if (!templateName || !vscode.workspace.workspaceFolders) { return; }

    if (vscode.workspace.workspaceFolders.length > 1) {
        try {
            const chosen = await vscode.window.showWorkspaceFolderPick();
            if (!chosen) { return; }
            let folder = chosen.uri;
            await downloadTemplate(files, templateName, folder.fsPath, local);
        } catch (err) {
            vscode.window.showErrorMessage(`Easy C++ error: ${err}`);
        }

    } else {
        downloadTemplate(files, templateName, vscode.workspace.workspaceFolders[0].uri.fsPath, local, custom);
    }
};

const downloadTemplate = async (files: EasyProjectsJSON, templateName: string, folder: string, local?: boolean, custom?: boolean) => {
    if (files.directories) {
        files.directories.forEach((dir: string) => {
            if (!existsSync(`${folder}/${dir}`)) {
                mkdirSync(`${folder}/${dir}`);
            }
        });
    }

    let directories = files.templates[templateName].directories;
    if (directories) {
        directories.forEach((dir: string) => {
            if (!existsSync(`${folder}/${dir}`)) {
                mkdirSync(`${folder}/${dir}`);
            }
        });
    }

    let blankFiles = files.templates[templateName].blankFiles;
    if (blankFiles) {
        blankFiles.forEach((file: string) => {
            if (!existsSync(`${folder}/${file}`)) {
                writeFileSync(`${folder}/${file}`, '');
            }
        });
    }

    let f = files.templates[templateName].files;
    if (f) {
        for (let file in f) {
            try {
                let data;
                if (local) {
                    if (custom) {
                        data = readFileSync(`${customTemplatesFolder}/${file}`).toString();
                    } else {
                        data = readFileSync(`${__dirname}/templates/project/${file}`).toString();
                    }
                } else {
                    //? probably must add new template on server
                    const res = await fetch(`${baseUrl}/templates/project/${file}`);
                    data = await res.text();
                }

                writeFileSync(`${folder}/${f[file]}`, data);
            } catch (error) {
                if (local) {
                    vscode.window.showErrorMessage(`Easy C++ Projects error: Could not load '${file}' locally.\nError: ${error}`);
                } else {
                    vscode.window.showWarningMessage(`Easy C++ Projects error: Could not download '${file}' from GitHub, using local files.\nError: ${error}`);
                }
            }
        }
    }

    let openFiles = files.templates[templateName].openFiles;
    if (openFiles) {
        for (let file of openFiles) {
            if (existsSync(`${folder}/${file}`)) {
                vscode.workspace.openTextDocument(`${folder}/${file}`)
                    .then(doc => vscode.window.showTextDocument(doc, { preview: false }));
            }
        }
    }

    if (!existsSync(`${folder}/.vscode`)) {
        mkdirSync(`${folder}/.vscode`);
    }
    writeFileSync(`${folder}/.vscode/.easycpp`, 'This file is created by Easy C++ Projects, please ignore and do not delete it');
};


const createGetterSetter = (getter?: boolean, setter?: boolean) => {
    if (!getter && !setter) {
        getter = setter = true;
    }
    let editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const getterSnippet = (variableName: string, variableType: string) => {
        return new vscode.SnippetString(`
    ${variableType} get${variableName.charAt(0).toUpperCase() + variableName.substring(1)}() {
        return ${variableName};
    }
    `);
    };
    const setterSnippet = (variableName: string, variableType: string) => {
        return new vscode.SnippetString(`
    void set${variableName.charAt(0).toUpperCase() + variableName.substring(1)}(${variableType} ${variableName}) {
        this->${variableName} = ${variableName};
    }
    `);
    };

    let selection = editor.selection;
    let selectedText = editor.document.getText(new vscode.Range(selection.start, selection.end)).trim();

    let lines = selectedText.split('\n');

    let createData: { type: string, name: string }[] = [];

    for (let line of lines) {
        if (!/\s*\w+\s+[*]*\w+\s*(,\s*\w+\s*)*;+/.test(line)) {
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
        if (getter) { editor.insertSnippet(getterSnippet(e.name, e.type), new vscode.Position(selection.end.line + 1, 0)); }
        if (setter) { editor.insertSnippet(setterSnippet(e.name, e.type), new vscode.Position(selection.end.line + 1, 0)); }
    }
};

const createGetter = () => createGetterSetter(true, false);
const createSetter = () => createGetterSetter(false, true);