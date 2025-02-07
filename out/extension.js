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
const os = require("os");
const child_process_1 = require("child_process");
const fs = require("fs");
let recordingProcess = null;
let audioFilePath = null;
function activate(context) {
    // Register command for the right-corner recording button
    let recordCommand = vscode.commands.registerCommand("audio-comment.toggleRecording", () => {
        toggleRecording();
    });
    context.subscriptions.push(recordCommand);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function toggleRecording() {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }
        if (recordingProcess === null) {
            // Start recording
            yield startRecording();
        }
        else {
            // Stop recording and insert the comment with play button
            yield stopRecording(editor);
        }
    });
}
function startRecording() {
    return __awaiter(this, void 0, void 0, function* () {
        vscode.window.showInformationMessage("Recording started...");
        const fileName = `audio_comment_${Date.now()}.wav`;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No workspace folder open to save the audio file.");
            return;
        }
        const workspaceFolder = workspaceFolders[0];
        audioFilePath = path.join(workspaceFolder.uri.fsPath, fileName);
        const platform = os.platform();
        let recordCommand;
        let args;
        if (platform === "win32") {
            recordCommand = "sox";
            args = ["-t", "waveaudio", "default", "-b", "16", "-c", "2", "-r", "44100", audioFilePath];
        }
        else if (platform === "darwin") {
            recordCommand = "sox";
            args = ["-d", "-b", "16", "-c", "1", "-r", "16000", audioFilePath];
        }
        else if (platform === "linux") {
            recordCommand = "arecord";
            args = ["-f", "cd", "-t", "wav", "-c", "1", "-r", "16000", audioFilePath];
        }
        else {
            vscode.window.showErrorMessage("Unsupported platform for audio recording.");
            return;
        }
        recordingProcess = (0, child_process_1.spawn)(recordCommand, args);
    });
}
function stopRecording(editor) {
    return __awaiter(this, void 0, void 0, function* () {
        if (recordingProcess && audioFilePath) {
            recordingProcess.kill("SIGINT");
            recordingProcess = null;
            vscode.window.showInformationMessage("Recording stopped.");
            const position = editor.selection.active;
            const commentSymbol = getCommentSymbol(editor.document.languageId);
            const comment = `${commentSymbol} [Audio Comment]: ${audioFilePath}`;
            // Insert the audio comment and the play button
            yield editor.edit((editBuilder) => {
                editBuilder.insert(position, comment + "\n");
            });
            // Add inline play button next to the comment
            addPlayButton(editor, audioFilePath, position);
        }
    });
}
function addPlayButton(editor, audioPath, position) {
    const decorationType = vscode.window.createTextEditorDecorationType({
        after: {
            contentText: ' 🎵 Play',
            backgroundColor: '#EEE',
            margin: '0 5px',
            color: '#000',
            border: '1px solid #888'
        }
    });
    const range = new vscode.Range(position, position);
    editor.setDecorations(decorationType, [range]);
    // Listen for the selection on the "Play" button to play the audio
    vscode.window.onDidChangeTextEditorSelection((event) => __awaiter(this, void 0, void 0, function* () {
        if (event.textEditor === editor) {
            const cursorPosition = event.selections[0].active;
            if (cursorPosition.isEqual(position)) {
                playAudio(audioPath);
            }
        }
    }));
}
function playAudio(audioPath) {
    if (!fs.existsSync(audioPath)) {
        vscode.window.showErrorMessage("Audio file not found.");
        return;
    }
    const platform = os.platform();
    let playCommand;
    let args;
    if (platform === "win32") {
        playCommand = "start";
        args = [audioPath];
    }
    else if (platform === "darwin") {
        playCommand = "afplay";
        args = [audioPath];
    }
    else if (platform === "linux") {
        playCommand = "aplay";
        args = [audioPath];
    }
    else {
        vscode.window.showErrorMessage("Unsupported platform for audio playback.");
        return;
    }
    (0, child_process_1.spawn)(playCommand, args);
}
function getCommentSymbol(languageId) {
    const commentSymbols = {
        javascript: "//",
        typescript: "//",
        python: "#",
        c: "//",
        cpp: "//",
        java: "//",
        csharp: "//",
        go: "//",
        ruby: "#",
        shellscript: "#",
        php: "//",
        perl: "#",
        rust: "//",
        kotlin: "//",
        swift: "//",
        "objective-c": "//",
        r: "#",
        powershell: "#"
    };
    return commentSymbols[languageId] || "//";
}
//# sourceMappingURL=extension.js.map