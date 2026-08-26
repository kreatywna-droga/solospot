import { runAgent } from "./opencode-adapter.mjs";

try {
  const result = await runAgent({
    role: "developer",
    task: "Odpowiedz tylko: ADAPTER_B5_OK",
  });

  console.log("ADAPTER_RESULT:");
  console.log(JSON.stringify(result, null, 2));

  console.log("TEST_007_B5_OK");
  process.exit(0);
} catch (error) {
  console.error("ADAPTER_ERROR:");
  console.error(error);

  console.log("TEST_007_B5_FAIL");
  process.exit(1);
}