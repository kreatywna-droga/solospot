/**
 * LogLevel enum for @web-factor/devtools
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export type LogLevelName = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';

export function parseLogLevel(level: string | LogLevel): LogLevel {
  if (typeof level === 'number') return level;
  const upper = level.toUpperCase();
  switch (upper) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'NONE': return LogLevel.NONE;
    default: return LogLevel.INFO;
  }
}
