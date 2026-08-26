import { spawn } from "node:child_process";

const prompt = `
B13-G7-5 IMPLEMENTATION TASK

Integrate the EXISTING .agent-control/opencode-adapter.mjs runAgent()
into AgentExecutionBridge in .agent-control/queue_watcher.mjs.

STRICT SCOPE:

1. Do NOT remove or alter the existing "signal" strategy.
2. Do NOT change the existing "command" strategy.
3. Add a new explicit strategy named "acp".
4. The "acp" strategy must use the EXISTING exported runAgent() from:
   .agent-control/opencode-adapter.mjs
5. Do NOT duplicate ACP implementation in queue_watcher.mjs.
6. Do NOT create another OpenCode adapter.
7. Do NOT modify retry logic.
8. Do NOT modify createExecutionPlan().
9. Do NOT modify executeExecutionPlan() semantics except where strictly necessary
   to pass the Developer task to the existing ACP bridge.
10. Do NOT acquire or release lifecycle locks inside the new ACP strategy.
11. Do NOT write STATE.md or QUEUE.md directly from the bridge.
12. The ACP result must be returned from AgentExecutionBridge.dispatch().
13. Developer role must use the existing runAgent model mapping:
    developer -> opencode/deepseek-v4-flash-free
14. Preserve the current default strategy "signal".
15. ACP must only be used when config.defaultStrategy === "acp".

EXPECTED ARCHITECTURE:

QUEUE
  -> evaluateAndResume()
  -> AgentExecutionBridge.dispatch()
  -> strategy "acp"
  -> existing runAgent({ role, task, cwd })
  -> OpenCode ACP
  -> real response
  -> dispatch() result

CONFIG:

Preserve existing strategies.
Add:

acp: {
  enabled: false
}

Do NOT make ACP the default.

VALIDATION:

- queue_watcher.mjs syntax must pass.
- opencode-adapter.mjs syntax must pass.
- Existing helpers must remain exported.
- Existing signal behavior must remain unchanged.
- Existing command behavior must remain unchanged.
- No direct ACP implementation may be copied into queue_watcher.mjs.
- No real dispatch should happen during implementation.

Return a concise implementation report containing:
STATUS
FILES_CHANGED
ACP_INTEGRATION
SIGNAL_PRESERVED
COMMAND_PRESERVED
DEFAULT_STRATEGY_PRESERVED
NO_DUPLICATED_ACP
VALIDATION
NEXT_ACTION
`;

const opencode =
  String.raw`C:\Users\HP\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe`;

const child = spawn(
  opencode,
  ["run", prompt, "--model", "opencode/deepseek-v4-flash-free"],
  {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  }
);

child.stdout.on("data", data => {
  process.stdout.write(data.toString());
});

child.stderr.on("data", data => {
  process.stderr.write(data.toString());
});

child.on("exit", code => {
  process.exitCode = code ?? 1;
});