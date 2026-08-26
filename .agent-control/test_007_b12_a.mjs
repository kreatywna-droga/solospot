import { runAgent } from "./opencode-adapter.mjs";

console.log("B12-A: START");

try {
  const result = await runAgent({
    role: "architect",
    task: `
You are the WEB FACTOR Architect.

Answer exactly:

ARCHITECT_B12_A_OK

Do not inspect the repository.
Do not use tools.
Do not modify files.
`,
    cwd: process.cwd(),
  });

  console.log("B12-A: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (result?.model !== "opencode/mimo-v2.5-free") {
    throw new Error(`WRONG_MODEL: ${result?.model}`);
  }

  if (!result?.response?.includes("ARCHITECT_B12_A_OK")) {
    throw new Error("ARCHITECT_RESPONSE_INVALID");
  }

  console.log("B12_A_MODEL_OK");
  console.log("B12_A_RESPONSE_OK");
  console.log("TEST_007_B12_A_OK");
} catch (error) {
  console.error("B12-A: ERROR");
  console.error(error);
  process.exitCode = 1;
}