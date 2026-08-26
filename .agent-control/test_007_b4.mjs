import { spawn } from "node:child_process";

const opencode =
  "C:\\Users\\HP\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe";

const child = spawn(opencode, ["acp"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
  shell: false,
});

let buffer = "";
let promptSent = false;
let testFinished = false;
let timeoutHandle = null;

function finishTest(code) {
  if (testFinished) return;

  testFinished = true;

  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  process.exitCode = code;

  try {
    child.kill();
  } catch {
    // Proces mógł już być zamknięty.
  }
}

child.stdout.on("data", (data) => {
  const text = data.toString();

  buffer += text;

  console.log("ACP OUT:");
  console.log(text);

  const lines = buffer.split("\n");

  // Zachowujemy ostatnią niepełną linię do następnego fragmentu danych.
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const msg = JSON.parse(line);

      // Odpowiedź na session/new.
      if (msg.id === 2 && msg.result?.sessionId) {
        const sessionId = msg.result.sessionId;

        console.log("SESSION_ID:", sessionId);

        sendPrompt(sessionId);
      }

      // Strumieniowana odpowiedź agenta.
      if (
        msg.method === "session/update" &&
        msg.params?.update?.sessionUpdate === "agent_message_chunk"
      ) {
        const content = msg.params.update.content;

        const text =
          typeof content?.text === "string"
            ? content.text
            : "";

        if (text.includes("ACP_DEEPSEEK_B4_OK")) {
          console.log("B4_RESPONSE_OK");
        }
      }

      // Odpowiedź na session/prompt.
      if (
        msg.id === 4 &&
        msg.result?.stopReason === "end_turn"
      ) {
        console.log("B4_END_TURN_OK");
        console.log("TEST_007_B4_OK");

        finishTest(0);
        return;
      }
    } catch {
      // Pomijamy niepełne lub nie-JSON dane.
    }
  }
});

child.stderr.on("data", (data) => {
  console.log("ACP ERR:");
  console.log(data.toString());
});

child.on("error", (error) => {
  console.error("PROCESS ERROR:", error.message);
  finishTest(1);
});

child.on("close", (code) => {
  console.log("EXIT_CODE:", testFinished ? process.exitCode : code);

  if (!testFinished) {
    process.exitCode = code ?? 1;
  }
});

function send(message) {
  console.log("SEND:", message.method);

  child.stdin.write(JSON.stringify(message) + "\n");
}

function sendPrompt(sessionId) {
  if (promptSent) return;

  promptSent = true;

  // Ustawiamy darmowy model DeepSeek.
  send({
    jsonrpc: "2.0",
    id: 3,
    method: "session/set_config_option",
    params: {
      sessionId,
      configId: "model",
      value: "opencode/deepseek-v4-flash-free",
    },
  });

  // Dajemy ACP chwilę na zastosowanie konfiguracji.
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
            text: "Odpowiedz tylko: ACP_DEEPSEEK_B4_OK",
          },
        ],
      },
    });
  }, 1000);

  // Bezpieczny timeout.
  timeoutHandle = setTimeout(() => {
    console.error("TEST_TIMEOUT");
    finishTest(1);
  }, 15000);
}

// 1. Initialize ACP.
send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: 1,
    clientCapabilities: {},
    clientInfo: {
      name: "WEB-FACTOR-TEST",
      version: "1.0",
    },
  },
});

// 2. Create ACP session.
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
}, 1000);