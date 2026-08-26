import { spawn } from "node:child_process";

const opencode = "C:\\Users\\HP\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe";

const child = spawn(opencode, ["acp"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
  shell: false
});

let buffer = "";

child.stdout.on("data", data => {
  buffer += data.toString();
  console.log("ACP OUT:");
  console.log(data.toString());
});

child.stderr.on("data", data => {
  console.log("ACP ERR:");
  console.log(data.toString());
});

child.on("error", error => {
  console.error("PROCESS ERROR:", error.message);
});

child.on("close", code => {
  console.log(`EXIT_CODE: ${code}`);
});

function send(message) {
  console.log("SEND:", message.method);
  child.stdin.write(JSON.stringify(message) + "\n");
}

// 1. Initialize ACP
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

// 2. Create session after initialization
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

// 3. Keep process alive long enough to observe ACP
setTimeout(() => {
  console.log("TEST_TIMEOUT");
  child.kill();
}, 10000);