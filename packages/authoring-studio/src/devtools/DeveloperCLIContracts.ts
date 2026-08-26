/**
 * DeveloperCLIContracts.ts — Sprint S1 Developer CLI Contracts (ETAP 5)
 *
 * Declarative contracts for developer CLI commands (build, validate, doctor, analyze, release, docs).
 *
 * NO DOM, NO React, NO Browser API, ZERO Execution logic.
 */

export type CLICommandName = 'build' | 'validate' | 'doctor' | 'analyze' | 'release' | 'docs';

export interface CLICommandOption {
  readonly optionName: string;
  readonly type: 'string' | 'boolean' | 'number';
  readonly description: string;
  readonly isRequired: boolean;
}

export interface CLICommandDescriptor {
  readonly commandName: CLICommandName;
  readonly description: string;
  readonly options: ReadonlyArray<CLICommandOption>;
}

export const COMMAND_BUILD: CLICommandDescriptor = {
  commandName: 'build',
  description: 'Compiles authoring-studio and builder-core production bundles',
  options: [
    { optionName: 'minify', type: 'boolean', description: 'Enable production minification', isRequired: false },
  ],
};

export const COMMAND_VALIDATE: CLICommandDescriptor = {
  commandName: 'validate',
  description: 'Runs full architectural validation suite (TSC, Vitest, SSOT, Freeze)',
  options: [
    { optionName: 'strict', type: 'boolean', description: 'Enable strict freeze checks', isRequired: false },
  ],
};

export const COMMAND_DOCTOR: CLICommandDescriptor = {
  commandName: 'doctor',
  description: 'Diagnoses environment health, dependencies, and adapter integrity',
  options: [],
};

export const COMMAND_ANALYZE: CLICommandDescriptor = {
  commandName: 'analyze',
  description: 'Computes bundle sizes, dependency graphs, and code metrics',
  options: [],
};

export const COMMAND_RELEASE: CLICommandDescriptor = {
  commandName: 'release',
  description: 'Generates release manifests, changelogs, and API freeze manifests',
  options: [
    { optionName: 'targetVersion', type: 'string', description: 'Target release semver string', isRequired: true },
  ],
};

export const COMMAND_DOCS: CLICommandDescriptor = {
  commandName: 'docs',
  description: 'Generates API reference and architecture documentation bundle',
  options: [],
};

export const ALL_CLI_COMMANDS: ReadonlyArray<CLICommandDescriptor> = [
  COMMAND_BUILD,
  COMMAND_VALIDATE,
  COMMAND_DOCTOR,
  COMMAND_ANALYZE,
  COMMAND_RELEASE,
  COMMAND_DOCS,
];
