import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";

let recordingProcess: ChildProcess | null = null;
let audioFilePath: string | null = null;

export function activate(context: vscode.ExtensionContext) {
  // Register command for the right-corner recording button
  let recordCommand = vscode.commands.registerCommand(
    "audio-comment.toggleRecording",
    () => {
      toggleRecording();
    }
  );

  context.subscriptions.push(recordCommand);
}

export function deactivate() {}

async function toggleRecording() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found.");
    return;
  }

  if (recordingProcess === null) {
    // Start recording
    await startRecording();
  } else {
    // Stop recording and insert the comment with play button
    await stopRecording(editor);
  }
}

async function startRecording() {
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
  let recordCommand: string;
  let args: string[];

  if (platform === "win32") {
    recordCommand = "sox";
    args = ["-t", "waveaudio", "default", "-b", "16", "-c", "2", "-r", "44100", audioFilePath];
  } else if (platform === "darwin") {
    recordCommand = "sox";
    args = ["-d", "-b", "16", "-c", "1", "-r", "16000", audioFilePath];
  } else if (platform === "linux") {
    recordCommand = "arecord";
    args = ["-f", "cd", "-t", "wav", "-c", "1", "-r", "16000", audioFilePath];
  } else {
    vscode.window.showErrorMessage("Unsupported platform for audio recording.");
    return;
  }

  recordingProcess = spawn(recordCommand, args);
}

async function stopRecording(editor: vscode.TextEditor) {
  if (recordingProcess && audioFilePath) {
    recordingProcess.kill("SIGINT");
    recordingProcess = null;
    vscode.window.showInformationMessage("Recording stopped.");

    const position = editor.selection.active;
    const commentSymbol = getCommentSymbol(editor.document.languageId);
    const comment = `${commentSymbol} [Audio Comment]: ${audioFilePath}`;

    // Insert the audio comment and the play button
    await editor.edit((editBuilder) => {
      editBuilder.insert(position, comment + "\n");
    });

    // Add inline play button next to the comment
    addPlayButton(editor, audioFilePath, position);
  }
}

function addPlayButton(editor: vscode.TextEditor, audioPath: string, position: vscode.Position) {
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
  vscode.window.onDidChangeTextEditorSelection(async (event) => {
    if (event.textEditor === editor) {
      const cursorPosition = event.selections[0].active;
      if (cursorPosition.isEqual(position)) {
        playAudio(audioPath);
      }
    }
  });
}

function playAudio(audioPath: string) {
  if (!fs.existsSync(audioPath)) {
    vscode.window.showErrorMessage("Audio file not found.");
    return;
  }

  const platform = os.platform();
  let playCommand: string;
  let args: string[];

  if (platform === "win32") {
    playCommand = "start";
    args = [audioPath];
  } else if (platform === "darwin") {
    playCommand = "afplay";
    args = [audioPath];
  } else if (platform === "linux") {
    playCommand = "aplay";
    args = [audioPath];
  } else {
    vscode.window.showErrorMessage("Unsupported platform for audio playback.");
    return;
  }

  spawn(playCommand, args);
}

function getCommentSymbol(languageId: string): string {
  const commentSymbols: { [key: string]: string } = {
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
