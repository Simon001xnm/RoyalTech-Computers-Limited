
/**
 * @fileOverview Professional Business Event Logger
 * Used for tracking audit trails, sales events, and system errors.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'business';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  event: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  
  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private format(entry: LogEntry): string {
    const icon = entry.level === 'error' ? '🔴' : entry.level === 'business' ? '💰' : '🔹';
    return `${icon} [${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}] ${entry.event}`;
  }

  public log(level: LogLevel, module: string, event: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      event,
      metadata
    };

    // In development, we use console
    if (process.env.NODE_ENV === 'development') {
      const message = this.format(entry);
      if (level === 'error') console.error(message, metadata);
      else if (level === 'warn') console.warn(message, metadata);
      else console.log(message, metadata);
    }

    // Roadmap: v2.0 will sync these logs to a central Super Admin database
  }

  public business(module: string, event: string, metadata?: Record<string, any>) {
    this.log('business', module, event, metadata);
  }

  public error(module: string, event: string, error?: any) {
    this.log('error', module, event, { error: error?.message || error });
  }
}

export const logger = Logger.getInstance();
