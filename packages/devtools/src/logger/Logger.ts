import { LogLevel, parseLogLevel } from './LogLevel';
import { KnownNamespace } from './Namespace';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  namespace: KnownNamespace;
  message: string;
  args: any[];
}

export interface LoggerConfig {
  level?: LogLevel | string;
  enabled?: boolean;
  productionSilentMode?: boolean;
  isProduction?: boolean;
}

export class Logger {
  private level: LogLevel = LogLevel.INFO;
  private enabled: boolean = true;
  private productionSilentMode: boolean = false;
  private isProduction: boolean = false;
  private namespace: KnownNamespace = 'devtools';
  private logsHistory: LogEntry[] = [];
  private maxHistorySize: number = 200;

  constructor(namespace: KnownNamespace = 'devtools', config?: LoggerConfig) {
    this.namespace = namespace;
    if (config) {
      if (config.level !== undefined) this.level = parseLogLevel(config.level);
      if (config.enabled !== undefined) this.enabled = config.enabled;
      if (config.productionSilentMode !== undefined) this.productionSilentMode = config.productionSilentMode;
      if (config.isProduction !== undefined) this.isProduction = config.isProduction;
    }
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

public isEnabled(messageLevel?: LogLevel): boolean {
    if (!this.enabled) return false;
    // If checking a specific message level, also verify it meets the configured level threshold
    if (messageLevel !== undefined && messageLevel < this.level) return false;
    return true;
  }

  public setLogLevel(level: LogLevel | string): void {
    this.level = parseLogLevel(level);
  }

  public getLogLevel(): LogLevel {
    return this.level;
  }

  public setProductionSilentMode(silent: boolean): void {
    this.productionSilentMode = silent;
  }

  public setIsProduction(isProd: boolean): void {
    this.isProduction = isProd;
  }

  public createChildLogger(childNamespace: KnownNamespace): Logger {
    const fullNamespace = `${this.namespace}:${childNamespace}`;
    const child = new Logger(fullNamespace, {
      level: this.level,
      enabled: this.enabled,
      productionSilentMode: this.productionSilentMode,
      isProduction: this.isProduction,
    });
    return child;
  }

  public debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }

  public info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, args);
  }

  public warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, args);
  }

  public error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, args);
  }

private log(level: LogLevel, message: string, args: any[]): void {
    if (!this.isEnabled()) return;
    if (level < this.level) return;
    // Production silent mode: suppress everything below ERROR
    if (this.isProduction && this.productionSilentMode && level < LogLevel.ERROR) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      namespace: this.namespace,
      message,
      args,
    };

    // Store in history
    this.logsHistory.push(entry);
    if (this.logsHistory.length > this.maxHistorySize) {
      this.logsHistory.shift();
    }

    // Console transport
    this.consoleTransport(entry);
  }

  private consoleTransport(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.namespace}]`;
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, ...entry.args);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, ...entry.args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, ...entry.args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, ...entry.args);
        break;
    }
  }

  public getHistory(): LogEntry[] {
    return [...this.logsHistory];
  }

  public clearHistory(): void {
    this.logsHistory = [];
  }
}
