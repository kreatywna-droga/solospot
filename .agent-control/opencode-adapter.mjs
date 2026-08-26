import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, "runner_config.json");

const DEFAULT_EXECUTABLE = "opencode";
const DEFAULT_TIMEOUT_MS = 180000;

export const DEFAULT_MODELS = {
  developer: "opencode/deepseek-v4-flash-free",
  auditor: "opencode/nemotron-3-ultra-free",
  orchestrator: "opencode/mimo-v2.5-free",
  planner: "opencode/mimo-v2.5-free",
  fallback: "opencode/big-pickle",
};

export const MODELS = DEFAULT_MODELS;

export function loadAdapterConfig(configPath = CONFIG_PATH) {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf8");
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function getOpenCodeExecutable(configPath = CONFIG_PATH) {
  if (process.env.OPENCODE_BIN && process.env.OPENCODE_BIN.trim()) {
    return process.env.OPENCODE_BIN.trim();
  }
  const config = loadAdapterConfig(configPath);
  if (config?.strategies?.acp?.executable && typeof config.strategies.acp.executable === "string") {
    return config.strategies.acp.executable.trim();
  }
  if (config?.executable && typeof config.executable === "string") {
    return config.executable.trim();
  }
  return DEFAULT_EXECUTABLE;
}

export function modelForRole(role, configPath = CONFIG_PATH) {
  const envKey = `OPENCODE_MODEL_${String(role || "").toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  if (process.env[envKey] && process.env[envKey].trim()) {
    return process.env[envKey].trim();
  }
  if (process.env.OPENCODE_MODEL && process.env.OPENCODE_MODEL.trim()) {
    return process.env.OPENCODE_MODEL.trim();
  }

  const config = loadAdapterConfig(configPath);
  const acpModels = config?.strategies?.acp?.models;
  if (acpModels && typeof acpModels === "object") {
    if (acpModels[role]) {
      return acpModels[role];
    }
    if (acpModels.fallback) {
      return acpModels.fallback;
    }
  }

  const rootModels = config?.models;
  if (rootModels && typeof rootModels === "object") {
    if (rootModels[role]) {
      return rootModels[role];
    }
    if (rootModels.fallback) {
      return rootModels.fallback;
    }
  }

  return DEFAULT_MODELS[role] ?? DEFAULT_MODELS.fallback;
}

export function getAcpTimeout(configPath = CONFIG_PATH, fallback = DEFAULT_TIMEOUT_MS) {
  if (process.env.OPENCODE_TIMEOUT_MS) {
    const envTimeout = parseInt(process.env.OPENCODE_TIMEOUT_MS, 10);
    if (Number.isFinite(envTimeout) && envTimeout > 0) {
      return envTimeout;
    }
  }

  const config = loadAdapterConfig(configPath);
  const timeoutMs = config?.strategies?.acp?.timeoutMs ?? config?.timeoutMs;
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return timeoutMs;
  }
  return fallback;
}

export function runAgent({
  role = "developer",
  task,
  cwd = process.cwd(),
  timeoutMs,
  configPath = CONFIG_PATH,
  model: customModel,
  executable: customExecutable,
} = {}) {
  if (!task || typeof task !== "string") {
    throw new Error("runAgent: task is required");
  }

  const model = customModel || modelForRole(role, configPath);
  const executable = customExecutable || getOpenCodeExecutable(configPath);
  const effectiveTimeout =
    (Number.isFinite(timeoutMs) && timeoutMs > 0)
      ? timeoutMs
      : getAcpTimeout(configPath, DEFAULT_TIMEOUT_MS);

  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const useShell = isWindows && !path.isAbsolute(executable);
    const child = spawn(executable, ["acp"], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      shell: useShell,
    });

    let buffer = "";
    let sessionId = null;
    let promptSent = false;
    let finished = false;

    // Zbieramy rzeczywistą odpowiedź agenta.
    let response = "";

    const timeout = setTimeout(() => {
      finish(new Error("OpenCode ACP timeout"));
    }, effectiveTimeout);

    function finish(error, result) {
      if (finished) return;

      finished = true;
      clearTimeout(timeout);

      try {
        child.kill();
      } catch { }

      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }

    function send(message) {
      if (finished) return;

      child.stdin.write(JSON.stringify(message) + "\n");
    }

    function sendPrompt() {
      if (!sessionId || promptSent) return;

      promptSent = true;

      send({
        jsonrpc: "2.0",
        id: 3,
        method: "session/set_config_option",
        params: {
          sessionId,
          configId: "model",
          value: model,
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
                text: task,
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

        // Sesja została utworzona.
        if (msg.id === 2 && msg.result?.sessionId) {
          sessionId = msg.result.sessionId;
          sendPrompt();
        }

        // Rzeczywista odpowiedź agenta przychodzi
        // jako session/update -> agent_message_chunk.
        if (
          msg.method === "session/update" &&
          msg.params?.update?.sessionUpdate === "agent_message_chunk"
        ) {
          const content = msg.params.update.content;

          if (
            content &&
            content.type === "text" &&
            typeof content.text === "string"
          ) {
            response += content.text;
          }
        }

        // Prompt zakończony.
        if (
          msg.id === 4 &&
          msg.result?.stopReason === "end_turn"
        ) {
          finish(null, {
            role,
            model,
            sessionId,
            response: response.trim(),
          });
        }
      }
    });

    child.stderr.on("data", () => {
      // Diagnostyka ACP nie jest traktowana jako błąd.
    });

    child.on("error", (error) => {
      finish(error);
    });

    child.on("close", (code) => {
      if (!finished && code !== 0) {
        finish(
          new Error(`OpenCode exited with code ${code}`)
        );
      }
    });

    // ACP initialize.
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: 1,
        clientCapabilities: {},
        clientInfo: {
          name: "WEB-FACTOR-ADAPTER",
          version: "1.0",
        },
      },
    });

    // Utworzenie sesji.
    setTimeout(() => {
      send({
        jsonrpc: "2.0",
        id: 2,
        method: "session/new",
        params: {
          cwd,
          mcpServers: [],
        },
      });
    }, 500);
  });
}

/**
 * ExecutionRuntime port implementation for OpenCode ACP.
 */
export class OpenCodeExecutionRuntime {
  constructor(config = {}) {
    this.name = "opencode";
    this.configPath = config.configPath || CONFIG_PATH;
    this.defaultCwd = config.cwd || process.cwd();
    this.executable = config.executable || null;
    this.models = config.models || null;
    this.timeoutMs = config.timeoutMs || null;
  }

  async execute({
    taskId,
    role = "developer",
    task,
    context = {},
    cwd = this.defaultCwd,
    timeoutMs = this.timeoutMs,
    model,
    executable = this.executable,
  } = {}) {
    const effectiveTask =
      task ||
      context?.task ||
      context?.[`${role}Task`] ||
      context?.developerTask ||
      `Execute task ${taskId || ""}.`;

    const effectiveModel =
      model ||
      this.models?.[role] ||
      modelForRole(role, this.configPath);

    const result = await runAgent({
      role,
      task: effectiveTask,
      cwd,
      timeoutMs,
      configPath: this.configPath,
      model: effectiveModel,
      executable,
    });

    return {
      success: true,
      dispatched: true,
      role: result.role || role,
      taskId,
      backend: "opencode",
      model: result.model,
      sessionId: result.sessionId,
      response: result.response,
      result,
    };
  }
}

export function createOpenCodeRuntime(config = {}) {
  return new OpenCodeExecutionRuntime(config);
}