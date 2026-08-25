# G1-62 Transaction Model

## Transaction Principles
1. **Single Commit Per Theme Modification**: `updateColorScheme`, `updateTypography`, and `toggleDarkMode` commit exactly 1 `HistoryStack` entry.
2. **Zero Commit on Contrast Evaluation**: `evaluateA11yContrast` commits 0 `HistoryStack` entries.
3. **Determinism**: Identical design tokens produce identical CSS custom property strings (`cssVariables`).
