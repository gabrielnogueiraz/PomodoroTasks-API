/**
 * Sistema de logging para produção
 * Centraliza todos os logs da aplicação com diferentes níveis
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

class Logger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error, metadata } = entry;
    
    let logMessage = `[${timestamp}] ${level}`;
    
    if (context) {
      logMessage += ` [${context}]`;
    }
    
    logMessage += `: ${message}`;
    
    if (error) {
      logMessage += ` | Error: ${error.message}`;
      if (!this.isProduction && error.stack) {
        logMessage += `\nStack: ${error.stack}`;
      }
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      logMessage += ` | Metadata: ${JSON.stringify(metadata)}`;
    }
    
    return logMessage;
  }

  private log(level: LogLevel, message: string, context?: string, error?: Error, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      metadata
    };

    const formattedLog = this.formatLog(entry);

    // Em produção, usar console apropriado para o nível
    if (this.isProduction) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedLog);
          break;
        case LogLevel.WARN:
          console.warn(formattedLog);
          break;
        case LogLevel.INFO:
          console.info(formattedLog);
          break;
        case LogLevel.DEBUG:
          // Em produção, não logar debug por padrão
          if (process.env.LOG_LEVEL === 'DEBUG') {
            console.log(formattedLog);
          }
          break;
      }
    } else {
      // Em desenvolvimento, usar console.log com emojis para melhor visualização
      const emoji = this.getEmojiForLevel(level);
      console.log(`${emoji} ${formattedLog}`);
    }
  }

  private getEmojiForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return '❌';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.DEBUG:
        return '🐛';
      default:
        return '📝';
    }
  }

  error(message: string, context?: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  // Métodos específicos para diferentes contextos da aplicação
  database(message: string, metadata?: Record<string, any>): void {
    this.info(message, 'DATABASE', metadata);
  }

  auth(message: string, metadata?: Record<string, any>): void {
    this.info(message, 'AUTH', metadata);
  }

  api(message: string, metadata?: Record<string, any>): void {
    this.info(message, 'API', metadata);
  }

  performance(message: string, metadata?: Record<string, any>): void {
    this.debug(message, 'PERFORMANCE', metadata);
  }
}

// Singleton instance
export const logger = new Logger();
