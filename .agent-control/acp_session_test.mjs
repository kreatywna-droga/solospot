import { spawn } from "node:child_process";

const opencode = String.raw`C:\Users\HP\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe`;

const child = spawn(opencode, ["acp"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
  shell: false
});

child.stdout.on("data", data => {
  console.log("ACP OUT:");
  console.log(data.toString());
});

child.stderr.on("data", data => {
  console.log("ACP ERR:");
  console.log(data.toString());
});

child.on("error", err => {
  console.error("PROCESS ERROR:", err);
});

child.on("exit", (code, signal) => {
  console.log("EXIT:", code, signal);
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
      name: "WEB-FACTOR-TEST",
      version: "1.0"
    }
  }
});

setTimeout(() => {
  send({
    jsonrpc: "2.0",
    id: 2,
    method: "session/new",
    params: {
      cwd: process.cwd(),
      mcpServers: []
    }
  });
}, 1500);

setTimeout(() => {
  child.kill();
}, 7000);
