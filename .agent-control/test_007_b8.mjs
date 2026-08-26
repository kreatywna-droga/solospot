import { runAgent } from "./opencode-adapter.mjs";

const targetFile = "src/lib/runtime/RuntimeEngine.ts";

const task = `
Jesteś agentem Developer działającym w trybie READ-ONLY.

Projekt: WEB FACTOR.

Przeanalizuj wyłącznie plik:
${targetFile}

WAŻNE:
- Nie modyfikuj żadnych plików.
- Nie twórz żadnych plików.
- Nie uruchamiaj formatowania.
- Nie wykonuj automatycznych napraw.
- Tylko odczytaj i przeanalizuj wskazany plik.

Na końcu odpowiedzi podaj dokładnie:

B8_FILE_ANALYSIS_OK
FILE: ${targetFile}
MODE: READ_ONLY
DECISION: PASS
`;

console.log("B8: START");
console.log("B8: ROLE = developer");
console.log(`B8: TARGET = ${targetFile}`);
console.log("B8: MODE = READ_ONLY");

try {
  const result = await runAgent({
    role: "developer",
    task,
  });

  console.log("\nB8: ADAPTER RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (result.role !== "developer") {
    throw new Error(`Wrong role: ${result.role}`);
  }

  if (
    result.model !==
    "opencode/deepseek-v4-flash-free"
  ) {
    throw new Error(`Wrong model: ${result.model}`);
  }

  console.log("\nB8_ROLE_OK");
  console.log("B8_MODEL_OK");
  console.log("B8_REPOSITORY_TASK_SENT");
  console.log("B8_READ_ONLY_TASK_SENT");
  console.log("TEST_007_B8_OK");

  process.exit(0);
} catch (error) {
  console.error("\nB8_ERROR:");
  console.error(error);

  console.log("TEST_007_B8_FAIL");

  process.exit(1);
}