/**
 * Structured Logging Utility
 * Provides consistent logging across HubSpot integration components
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  component?: string;
  operation?: string;
  assessmentId?: string;
  contactId?: string;
  dealId?: string;
  queueEntryId?: string;
  retryCount?: number;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    details?: any;
  };
}

/**
 * Structured logger with HubSpot integration context
 */
export class HubSpotLogger {
  private static instance: HubSpotLogger;
  private minLevel: LogLevel;
  private logToConsole: boolean;
  private logEntries: LogEntry[] = [];
  private maxStoredEntries: number = 1000;

  constructor(minLevel: LogLevel = LogLevel.INFO, logToConsole: boolean = true) {
    this.minLevel = minLevel;
    this.logToConsole = logToConsole;
  }

  static getInstance(): HubSpotLogger {
    if (!HubSpotLogger.instance) {
      const level = process.env.LOG_LEVEL
        ? LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel]
        : LogLevel.INFO;
      const logToConsole = process.env.NODE_ENV !== 'test';

      HubSpotLogger.instance = new HubSpotLogger(level, logToConsole);
    }
    return HubSpotLogger.instance;
  }

  /**
   * Logs debug information
   */
  debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs informational messages
   */
  info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs warnings
   */
  warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs errors
   */
  error(message: string, error?: Error, context: LogContext = {}): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        details: (error as any).details || (error as any).toJSON?.(),
      };
    }

    this.logEntry(logEntry);
  }

  /**
   * Logs operation start
   */
  operationStart(operation: string, context: LogContext = {}): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.info(`Starting ${operation}`, {
      ...context,
      operation,
      operationId,
      phase: 'start',
    });

    return operationId;
  }

  /**
   * Logs operation completion
   */
  operationComplete(
    operation: string,
    operationId: string,
    duration: number,
    context: LogContext = {}
  ): void {
    this.info(`Completed ${operation}`, {
      ...context,
      operation,
      operationId,
      duration,
      phase: 'complete',
    });
  }

  /**
   * Logs operation failure
   */
  operationFailed(
    operation: string,
    operationId: string,
    duration: number,
    error: Error,
    context: LogContext = {}
  ): void {
    this.error(`Failed ${operation}`, error, {
      ...context,
      operation,
      operationId,
      duration,
      phase: 'failed',
    });
  }

  /**
   * Logs HubSpot API call
   */
  apiCall(method: string, endpoint: string, context: LogContext = {}): void {
    this.debug(`HubSpot API call: ${method} ${endpoint}`, {
      ...context,
      component: 'hubspot-api',
      httpMethod: method,
      endpoint,
    });
  }

  /**
   * Logs HubSpot API response
   */
  apiResponse(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `HubSpot API response: ${method} ${endpoint} - ${statusCode} (${duration}ms)`;

    this.log(level, message, {
      ...context,
      component: 'hubspot-api',
      httpMethod: method,
      endpoint,
      statusCode,
      duration,
    });
  }

  /**
   * Logs rate limit status
   */
  rateLimitStatus(remaining: number, resetTime: Date, context: LogContext = {}): void {
    const level = remaining < 10 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `HubSpot rate limit status: ${remaining} requests remaining, resets at ${resetTime.toISOString()}`;

    this.log(level, message, {
      ...context,
      component: 'rate-limiter',
      remainingRequests: remaining,
      resetTime: resetTime.toISOString(),
    });
  }

  /**
   * Logs queue processing
   */
  queueProcessing(operation: string, batchSize: number, context: LogContext = {}): void {
    this.info(`Processing ${operation} queue: ${batchSize} entries`, {
      ...context,
      component: 'retry-queue',
      operation,
      batchSize,
    });
  }

  /**
   * Generic log method
   */
  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    if (level < this.minLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    this.logEntry(logEntry);
  }

  /**
   * Processes and stores log entry
   */
  private logEntry(entry: LogEntry): void {
    // Store in memory (with rotation)
    this.logEntries.push(entry);
    if (this.logEntries.length > this.maxStoredEntries) {
      this.logEntries.shift();
    }

    // Console output in development
    if (this.logToConsole) {
      const levelName = LogLevel[entry.level];
      const timestamp = entry.timestamp;
      const contextStr =
        Object.keys(entry.context).length > 0 ? JSON.stringify(entry.context, null, 2) : '';

      const logMessage = `[${timestamp}] ${levelName}: ${entry.message}${contextStr ? '\nContext: ' + contextStr : ''}`;

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(logMessage);
          break;
        case LogLevel.INFO:
          console.info(logMessage);
          break;
        case LogLevel.WARN:
          console.warn(logMessage);
          break;
        case LogLevel.ERROR:
          console.error(logMessage);
          if (entry.error?.stack) {
            console.error(entry.error.stack);
          }
          break;
      }
    }

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with external logging service (e.g., Datadog, LogRocket, etc.)
      this.sendToExternalLogger(entry);
    }
  }

  /**
   * Sends log entry to external logging service
   */
  private sendToExternalLogger(entry: LogEntry): void {
    // Placeholder for external logging integration
    // This could send to services like Datadog, Splunk, CloudWatch, etc.

    // Example: Send to webhook or logging API
    if (process.env.LOG_WEBHOOK_URL && entry.level >= LogLevel.WARN) {
      // Only send warnings and errors to external service to reduce noise
      try {
        // Async send without blocking
        fetch(process.env.LOG_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch(() => {
          // Silently fail - don't crash on logging errors
        });
      } catch {
        // Silently fail
      }
    }
  }

  /**
   * Gets recent log entries for debugging
   */
  getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
    let entries = this.logEntries;

    if (level !== undefined) {
      entries = entries.filter((entry) => entry.level >= level);
    }

    return entries.slice(-count);
  }

  /**
   * Clears stored log entries
   */
  clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Gets log statistics
   */
  getLogStats(): { total: number; byLevel: Record<string, number> } {
    const stats = {
      total: this.logEntries.length,
      byLevel: {} as Record<string, number>,
    };

    for (const entry of this.logEntries) {
      const levelName = LogLevel[entry.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
    }

    return stats;
  }
}

// Export singleton instance
export const logger = HubSpotLogger.getInstance();
