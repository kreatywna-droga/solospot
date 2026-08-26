import { spawn } from "node:child_process";

const OPENCODE =
  "C:\\Users\\HP\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe";

console.log("B11-D: START");

const child = spawn(OPENCODE, ["acp"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
  shell: false,
});

let buffer = "";
let sessionId = null;
let promptSent = false;
let finished = false;

const timeout = setTimeout(() => {
  console.log("B11-D: TIMEOUT");
  finish();
}, 30000);

function finish() {
  if (finished) return;

  finished = true;
  clearTimeout(timeout);

  try {
    child.kill();
  } catch {}

  console.log("B11-D: END");
}

function send(message) {
  if (finished) return;

  console.log("B11-D SEND:", message.method);
  child.stdin.write(JSON.stringify(message) + "\n");
}

function sendPrompt() {
  if (!sessionId || promptSent || finished) return;

  promptSent = true;

  console.log("B11-D: SESSION_ID =", sessionId);
  console.log("B11-D: SENDING SIMPLE PROMPT");

  send({
    jsonrpc: "2.0",
    id: 3,
    method: "session/set_config_option",
    params: {
      sessionId,
      configId: "model",
      value: "opencode/nemotron-3-ultra-free",
    },
  });

  setTimeout(() => {
    send({
      jsonrpc: "2.0",
      id: 4,
      method: "session/prompt",
      params: {
        sessionId,
        prompt: [
          {
            type: "text",
            text: "Odpowiedz dokładnie: B11_D_OK",
          },
        ],
      },
    });
  }, 500);
}

child.stdout.on("data", (data) => {
  buffer += data.toString();

  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.trim()) continue;

    let msg;

    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }

    console.log(
      "B11-D EVENT:",
      JSON.stringify(msg)
    );

    if (msg.id === 2 && msg.result?.sessionId) {
      sessionId = msg.result.sessionId;
      sendPrompt();
    }

    if (
      msg.method === "session/update" &&
      msg.params?.update
    ) {
      const update = msg.params.update;

      console.log(
        "B11-D UPDATE:",
        update.sessionUpdate
      );

      if (
        update.sessionUpdate === "agent_message_chunk" &&
        update.content?.text
      ) {
        console.log(
          "B11-D AGENT:",
          update.content.text
        );
      }
    }

    if (msg.id === 4) {
      console.log(
        "B11-D PROMPT_RESULT:",
        JSON.stringify(msg.result ?? msg.error ?? null)
      );

      if (msg.result?.stopReason) {
        console.log(
          "B11-D STOP_REASON:",
          msg.result.stopReason
        );
      }
    }
  }
});

child.stderr.on("data", (data) => {
  console.log(
    "B11-D STDERR:",
    data.toString()
  );
});

child.on("error", (error) => {
  console.error(
    "B11-D PROCESS_ERROR:",
    error.message
  );

  finish();
});

child.on("close", (code) => {
  console.log(
    "B11-D CLOSE_CODE:",
    code
  );

  if (!finished) {
    finish();
  }
});

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: 1,
    clientCapabilities: {},
    clientInfo: {
      name: "WEB-FACTOR-B11-D",
      version: "1.0",
    },
  },
});

setTimeout(() => {
  send({
    jsonrpc: "2.0",
    id: 2,
    method: "session/new",
    params: {
      cwd: process.cwd(),
      mcpServers: [],
    },
  });
}, 500);