/**
 * @fileOverview Professional Business Event Logger
 * Used for tracking audit trails, sales events, and system errors.
 * Upgraded to write to the persistent platformLogs table.
 */

import { db } from "@/db";

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

  public async log(level: LogLevel, module: string, event: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      event,
      metadata
    };

    // 1. Console Logging (Dev Environment)
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const message = this.format(entry);
      // FIXED: Directly call methods on console to avoid "Illegal invocation" context loss
      if (level === 'error') {
        console.error(message, metadata);
      } else if (level === 'warn') {
        console.warn(message, metadata);
      } else {
        console.log(message, metadata);
      }
    }

    // 2. Persistent Local Logging (SaaS Oversight)
    if (typeof window !== 'undefined') {
        try {
          await db.platformLogs.add({
            id: crypto.randomUUID(),
            ...entry
          });
        } catch (e) {
          // Silent fail for logging errors
        }
    }
  }

  public business(module: string, event: string, metadata?: Record<string, any>) {
    this.log('business', module, event, metadata);
  }

  public error(module: string, event: string, error?: any) {
    this.log('error', module, event, { error: error?.message || error });
  }

  public warn(module: string, event: string, metadata?: Record<string, any>) {
    this.log('warn', module, event, metadata);
  }
}

export const logger = Logger.getInstance();
