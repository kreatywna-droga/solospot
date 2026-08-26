import { spawn } from "node:child_process";

const opencode =
  "C:\\Users\\HP\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe";

const child = spawn(opencode, [
  "run",
  "--model",
  "opencode/deepseek-v4-flash-free",
  "Odpowiedz tylko: TEST_007_B1_OK"
], {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"],
  shell: false
});

child.stdout.on("data", data => {
  process.stdout.write(data);
});

child.stderr.on("data", data => {
  process.stderr.write(data);
});

child.on("error", error => {
  console.error("ERROR:", error.message);
});

child.on("close", code => {
  console.log(`\nEXIT_CODE: ${code}`);
});