import { describe, it, expect } from 'vitest';
import { ALL_CLI_COMMANDS, COMMAND_BUILD, COMMAND_RELEASE } from '../DeveloperCLIContracts';

describe('DeveloperCLIContracts (Sprint S1, ETAP 5)', () => {
  it('provides declarative CLI command contracts', () => {
    expect(ALL_CLI_COMMANDS).toHaveLength(6);
    expect(COMMAND_BUILD.commandName).toBe('build');
    expect(COMMAND_RELEASE.options.length).toBeGreaterThan(0);
  });
});
