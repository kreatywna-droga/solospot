import { runAgent } from "./opencode-adapter.mjs";

console.log("B11-E: START");

try {
  const result = await runAgent({
    role: "auditor",
    task: "Odpowiedz dokładnie jednym tekstem: B11_E_OK",
    cwd: process.cwd(),
  });

  console.log("B11-E: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (result?.response?.includes("B11_E_OK")) {
    console.log("B11_E_RESPONSE_OK");
  } else {
    console.log("B11_E_RESPONSE_FAIL");
  }

  console.log("TEST_007_B11_E_OK");
} catch (error) {
  console.error("B11-E: ERROR");
  console.error(error);
  process.exitCode = 1;
}