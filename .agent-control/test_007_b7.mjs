import { runAgent } from "./opencode-adapter.mjs";

const task = `
Jesteś agentem Developer.

To jest test TEST-007-B.7.
Nie modyfikuj żadnych plików.

Odpowiedz dokładnie w następującym formacie:

B7_TASK_RECEIVED
ROLE: developer
TASK: runtime execution test
DECISION: PASS
`;

console.log("B7: START");
console.log("B7: ROLE = developer");
console.log("B7: TASK SENT");

try {
  const result = await runAgent({
    role: "developer",
    task,
  });

  console.log("\nB7: ADAPTER RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (result.role !== "developer") {
    throw new Error(
      `Wrong role returned: ${result.role}`
    );
  }

  if (
    result.model !==
    "opencode/deepseek-v4-flash-free"
  ) {
    throw new Error(
      `Wrong model: ${result.model}`
    );
  }

  console.log("\nB7_ROLE_OK");
  console.log("B7_MODEL_OK");
  console.log("B7_TASK_EXECUTION_OK");
  console.log("TEST_007_B7_OK");

  process.exit(0);
} catch (error) {
  console.error("\nB7_ERROR:");
  console.error(error);

  console.log("TEST_007_B7_FAIL");

  process.exit(1);
}