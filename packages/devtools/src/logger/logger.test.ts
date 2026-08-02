import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from './Logger';
import { LogLevel } from './LogLevel';

describe('Logger Foundation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should create logger with namespace and default level', () => {
    const logger = new Logger('builder:canvas');
    expect(logger.getLogLevel()).toBe(LogLevel.INFO);
    expect(logger.isEnabled()).toBe(true);
  });

  it('should log messages according to log level', () => {
    const spyInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    const spyDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const logger = new Logger('test', { level: LogLevel.INFO });
    logger.debug('Debug msg');
    logger.info('Info msg');

    expect(spyDebug).not.toHaveBeenCalled();
    expect(spyInfo).toHaveBeenCalledOnce();
  });

  it('should respect enable and disable', () => {
    const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logger = new Logger('test');

    logger.disable();
    logger.warn('Warn msg 1');
    expect(spyWarn).not.toHaveBeenCalled();

    logger.enable();
    logger.warn('Warn msg 2');
    expect(spyWarn).toHaveBeenCalledOnce();
  });

  it('should handle production silent mode', () => {
    const spyInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const logger = new Logger('test', {
      isProduction: true,
      productionSilentMode: true,
      level: LogLevel.DEBUG,
    });

    logger.info('Should be silent in prod');
    expect(spyInfo).not.toHaveBeenCalled();

    logger.error('Error in prod');
    expect(spyError).toHaveBeenCalledOnce();
  });

  it('should create child loggers with inherited settings', () => {
    const parent = new Logger('parent', { level: LogLevel.WARN });
    const child = parent.createChildLogger('child');

    expect(child.getLogLevel()).toBe(LogLevel.WARN);
  });

  it('should maintain history log entries', () => {
    const logger = new Logger('history-test');
    logger.info('Message 1');
    logger.warn('Message 2');

    const history = logger.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].message).toBe('Message 1');
    expect(history[1].message).toBe('Message 2');
  });
});
