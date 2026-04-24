/**
 * @fileOverview Professional Business Event Logger
 * Migrated to persist logs directly to Firebase Firestore for cross-tenant audit trails.
 */

import { collection, addDoc, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

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

  /**
   * Persists log entry to Firestore platform_logs collection.
   */
  public async log(level: LogLevel, module: string, event: string, metadata?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = { timestamp, level, module, event, metadata };

    // Console mirror in development
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        const message = this.format(entry);
        if (level === 'error') console.error(message, metadata);
        else if (level === 'warn') console.warn(message, metadata);
        else console.log(message, metadata);
    }

    // Persist business and error events to Cloud Firestore
    if (typeof window !== 'undefined' && (level === 'business' || level === 'error')) {
        try {
            const { firestore } = initializeFirebase();
            if (firestore) {
                addDoc(collection(firestore, 'platform_logs'), {
                    ...entry,
                    createdAt: timestamp
                });
            }
        } catch (e) {
            // Silently fail to prevent log-loops
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
