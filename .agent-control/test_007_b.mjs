import { spawn } from "node:child_process";

const MODEL = "opencode/big-pickle";
const CWD = process.cwd();

const child = spawn(
  "C:\\Users\\HP\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe",
  ["acp", "--cwd", CWD],
  {
    cwd: CWD,
    stdio: ["pipe", "pipe", "pipe"],
    shell: false
  }
);

let buffer = "";

child.stdout.on("data", data => {
  buffer += data.toString();

  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.trim()) continue;

    console.log("ACP:", line);

    try {
      const msg = JSON.parse(line);

      if (msg.id === 1 && msg.result) {
        console.log("INITIALIZE_OK");

        send({
          jsonrpc: "2.0",
          id: 2,
          method: "session/new",
          params: {
            cwd: CWD,
            mcpServers: [],
            model: MODEL
          }
        });
      }

      if (msg.id === 2 && msg.result) {
        console.log("SESSION_NEW_OK");
        console.log("SESSION:", msg.result.sessionId);

        send({
          jsonrpc: "2.0",
          id: 3,
          method: "session/prompt",
          params: {
            sessionId: msg.result.sessionId,
            prompt: [
              {
                type: "text",
                text: "Odpowiedz dok³adnie: TEST_007_B_EXECUTION_OK"
              }
            ]
          }
        });
      }

      if (msg.id === 3) {
        console.log("PROMPT_RESULT_RECEIVED");
        console.log("TEST_007_B_COMPLETE");
        child.kill();
      }
    } catch {}
  }
});

child.stderr.on("data", data => {
  console.error("ACP ERR:", data.toString());
});

child.on("error", err => {
  console.error("PROCESS ERROR:", err.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  console.log("PROCESS EXIT:", code, signal);
});

function send(message) {
  console.log("SEND:", message.method);
  child.stdin.write(JSON.stringify(message) + "\n");
}

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: 1,
    clientCapabilities: {},
    clientInfo: {
      name: "WEB-FACTOR-TEST-007-B",
      version: "1.0"
    }
  }
});

setTimeout(() => {
  if (!child.killed) {
    console.error("TIMEOUT: TEST_007_B");
    child.kill();
    process.exitCode = 1;
  }
}, 60000);
