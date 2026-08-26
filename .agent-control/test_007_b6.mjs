import { runAgent } from "./opencode-adapter.mjs";

const tests = [
  {
    role: "developer",
    expectedModel: "opencode/deepseek-v4-flash-free",
  },
  {
    role: "auditor",
    expectedModel: "opencode/nemotron-3-ultra-free",
  },
  {
    role: "planner",
    expectedModel: "opencode/mimo-v2.5-free",
  },
  {
    role: "unknown",
    expectedModel: "opencode/big-pickle",
  },
];

let failed = false;

for (const test of tests) {
  console.log(`\nTEST ROLE: ${test.role}`);

  try {
    const result = await runAgent({
      role: test.role,
      task: `Odpowiedz tylko: ${test.role.toUpperCase()}_B6_OK`,
    });

    console.log("MODEL:", result.model);

    if (result.model !== test.expectedModel) {
      console.error(
        `FAIL: expected ${test.expectedModel}, got ${result.model}`
      );
      failed = true;
      continue;
    }

    console.log(`PASS: ${test.role}`);
  } catch (error) {
    console.error(`ERROR: ${test.role}`);
    console.error(error);
    failed = true;
  }
}

if (failed) {
  console.log("\nTEST_007_B6_FAIL");
  process.exit(1);
}

console.log("\nTEST_007_B6_OK");
process.exit(0);