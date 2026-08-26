import { spawn } from "node:child_process";

const opencode = String.raw`C:\Users\HP\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe`;

const child = spawn(opencode, ["acp"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
  shell: false
});

let buffer = "";
let sessionId = null;
let configured = false;
let finished = false;

function send(message) {
  console.log("SEND:", message.method);
  child.stdin.write(JSON.stringify(message) + "\n");
}

function finishTest(success, reason = "") {
  if (finished) return;
  finished = true;

  console.log("");
  console.log("========================================");

  if (success) {
    console.log("B13 ACP MODEL TEST: PASS");
  } else {
    console.log("B13 ACP MODEL TEST: FAIL");
    if (reason) {
      console.log("REASON:", reason);
    }
  }

  console.log("========================================");

  child.kill();
}

child.stdout.on("data", data => {
  const text = data.toString();

  console.log("ACP OUT:");
  console.log(text);

  buffer += text;

  // ------------------------------------------------------------
  // SESSION/NEW
  // ------------------------------------------------------------

  if (
    !sessionId &&
    text.includes('"id":2') &&
    text.includes('"sessionId"')
  ) {
    const match =
      text.match(/"sessionId":"([^"]+)"/);

    if (!match) {
      finishTest(false, "SESSION_ID_NOT_FOUND");
      return;
    }

    sessionId = match[1];

    console.log("SESSION:", sessionId);

    // ----------------------------------------------------------
    // IMPORTANT:
    // ACP exposes "model" as a session config option.
    // We therefore configure it through session/set_config_option.
    // ----------------------------------------------------------

    console.log(
      "SEND: session/set_config_option"
    );

    send({
      jsonrpc: "2.0",
      id: 3,
      method: "session/set_config_option",
      params: {
        sessionId,
        configId: "model",
        value: "opencode/deepseek-v4-flash-free"
      }
    });

    return;
  }

  // ------------------------------------------------------------
  // CONFIGURATION RESULT
  // ------------------------------------------------------------

  if (
    !configured &&
    text.includes('"id":3') &&
    (
      text.includes('"result"') ||
      text.includes('"configOptions"')
    )
  ) {
    configured = true;

    console.log(
      "MODEL CONFIGURATION RESULT RECEIVED"
    );

    console.log(
      "SEND: session/prompt"
    );

    send({
      jsonrpc: "2.0",
      id: 4,
      method: "session/prompt",
      params: {
        sessionId,
        prompt: [
          {
            type: "text",
            text:
              "Odpowiedz dokładnie jednym tekstem: TEST_007_EXECUTION_OK"
          }
        ]
      }
    });

    return;
  }

  // ------------------------------------------------------------
  // SUCCESS
  // ------------------------------------------------------------

  if (
    text.includes("TEST_007_EXECUTION_OK")
  ) {
    finishTest(true);
  }

  // ------------------------------------------------------------
  // ACP ERROR
  // ------------------------------------------------------------

  if (
    text.includes('"error"') &&
    text.includes('"id":4')
  ) {
    finishTest(
      false,
      "SESSION_PROMPT_ERROR"
    );
  }
});

child.stderr.on("data", data => {
  console.log("ACP ERR:");
  console.log(data.toString());
});

child.on("error", err => {
  console.error(
    "PROCESS ERROR:",
    err
  );

  finishTest(
    false,
    "PROCESS_ERROR"
  );
});

child.on("exit", (code, signal) => {
  console.log(
    "EXIT:",
    code,
    signal
  );
});

// --------------------------------------------------------------
// INITIALIZE
// --------------------------------------------------------------

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: 1,
    clientCapabilities: {},
    clientInfo: {
      name: "WEB-FACTOR-B13-ACP-TEST",
      version: "1.0"
    }
  }
});

// --------------------------------------------------------------
// SESSION/NEW
// --------------------------------------------------------------

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
}, 1000);

// --------------------------------------------------------------
// GLOBAL TEST TIMEOUT
// --------------------------------------------------------------

setTimeout(() => {
  if (!finished) {
    finishTest(
      false,
      "TEST_TIMEOUT"
    );
  }
}, 30000);