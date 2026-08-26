import { spawn } from "node:child_process";

const OPENCODE =
  "C:\\Users\\HP\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe";

console.log("B11-C: START");

const child = spawn(OPENCODE, ["acp"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
  shell: false,
});

let buffer = "";

function send(message) {
  console.log("B11-C SEND:", JSON.stringify(message));

  child.stdin.write(JSON.stringify(message) + "\n");
}

child.stdout.on("data", (data) => {
  const text = data.toString();

  console.log("B11-C STDOUT:");
  console.log(text);

  buffer += text;

  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const msg = JSON.parse(line);

      console.log(
        "B11-C JSON:",
        JSON.stringify(msg, null, 2)
      );

      if (msg.id === 2 && msg.result?.sessionId) {
        const sessionId = msg.result.sessionId;

        console.log("B11-C SESSION:", sessionId);

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
                  text: `
Audit TEST-007.

Return exactly:

AUDITOR RESULT
STATUS: HOLD
TASK_ID: TEST-007
FINDINGS:
Test diagnostic.
NEXT_ACTION:
Retry Developer.
HANDOFF:
Return task to Developer.
`,
                },
              ],
            },
          });
        }, 1000);
      }

      if (msg.id === 4) {
        console.log("B11-C PROMPT RESULT:");
        console.log(JSON.stringify(msg, null, 2));

        if (msg.result?.stopReason === "end_turn") {
          console.log("B11_C_END_TURN_OK");
          child.kill();
          process.exit(0);
        }
      }
    } catch {
      // stdout may contain non-JSON fragments
    }
  }
});

child.stderr.on("data", (data) => {
  console.log("B11-C STDERR:");
  console.log(data.toString());
});

child.on("error", (error) => {
  console.error("B11-C PROCESS ERROR:", error);
  process.exitCode = 1;
});

child.on("close", (code) => {
  console.log("B11-C CLOSE CODE:", code);
});

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: 1,
    clientCapabilities: {},
    clientInfo: {
      name: "WEB-FACTOR-B11-DIAGNOSTIC",
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

setTimeout(() => {
  console.error("B11-C TIMEOUT");
  child.kill();
  process.exitCode = 1;
}, 30000);