/**
 * AbortController utility for handling request cancellation
 */

export class AbortHandler {
  private static controllers = new Map<string, AbortController>();

  /**
   * Create a new AbortController for a specific operation
   */
  static create(operationId: string): AbortController {
    // Cancel existing controller if exists
    const existing = this.controllers.get(operationId);
    if (existing) {
      this.cancel(operationId);
    }

    const controller = new AbortController();
    this.controllers.set(operationId, controller);
    return controller;
  }

  /**
   * Cancel an operation by ID
   */
  static cancel(operationId: string): void {
    const controller = this.controllers.get(operationId);
    if (controller) {
      try {
        controller.abort();
      } catch (error) {
        // Ignore errors during abort
      }
      this.controllers.delete(operationId);
    }
  }

  /**
   * Cancel all operations
   */
  static cancelAll(): void {
    this.controllers.forEach((controller, id) => {
      this.cancel(id);
    });
  }

  /**
   * Get signal for an operation
   */
  static getSignal(operationId: string): AbortSignal | undefined {
    return this.controllers.get(operationId)?.signal;
  }

  /**
   * Check if an error is an AbortError
   */
  static isAbortError(error: any): boolean {
    if (!error) return false;

    return (
      error instanceof DOMException && error.name === 'AbortError' ||
      error?.name === 'AbortError' ||
      error?.code === 20 ||
      error?.code === 'AbortError' ||
      error?.message?.includes('signal is aborted') ||
      error?.message?.includes('AbortError') ||
      error?.message?.includes('The operation was aborted') ||
      error?.message?.includes('user aborted a request') ||
      error?.toString?.()?.includes('AbortError') ||
      error?.toString?.()?.includes('signal is aborted') ||
      error?.toString?.()?.includes('The operation was aborted') ||
      (typeof error === 'string' && (
        error.includes('AbortError') ||
        error.includes('signal is aborted') ||
        error.includes('The operation was aborted')
      ))
    );
  }

  /**
   * Handle AbortError in try-catch blocks
   */
  static handleError(error: any, operationName: string = 'Operation'): boolean {
    if (this.isAbortError(error)) {
      console.log(`${operationName} was aborted`);
      return true; // Error was handled
    }
    return false; // Error was not an abort error
  }

  /**
   * Wrap fetch with abort support
   */
  static async fetch(
    operationId: string,
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = this.create(operationId);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (this.isAbortError(error)) {
        throw new DOMException('Operation was aborted', 'AbortError');
      }
      throw error;
    } finally {
      this.controllers.delete(operationId);
    }
  }
}

/**
 * Global error handler for AbortErrors
 */
export function setupAbortErrorHandler(): void {
  // Enhanced global handler for all abort-related errors
  const handleAbortError = (event: PromiseRejectionEvent) => {
    if (AbortHandler.isAbortError(event.reason)) {
      event.preventDefault();
      // Don't log in production to keep console clean
      if (process.env.NODE_ENV === 'development') {
        console.log('Request was aborted:', event.reason?.message || 'Unknown abort reason');
      }
      return true;
    }
    return false;
  };

  // Add multiple listeners for comprehensive coverage
  window.addEventListener('unhandledrejection', handleAbortError);

  // Handle for different event types
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason && (
      reason.name === 'AbortError' ||
      reason.message?.includes('signal is aborted') ||
      reason.message?.includes('The operation was aborted') ||
      reason.toString?.()?.includes('AbortError')
    )) {
      event.preventDefault();
    }
  });

  // Also handle regular error events
  window.addEventListener('error', (event) => {
    if (AbortHandler.isAbortError(event.error)) {
      event.preventDefault();
      if (process.env.NODE_ENV === 'development') {
        console.log('Abort error caught:', event.error?.message || 'Unknown abort error');
      }
    }
  });

  // Handle rejectionhandled events too
  window.addEventListener('rejectionhandled', (event) => {
    if (AbortHandler.isAbortError(event.reason)) {
      event.preventDefault();
    }
  });
}

// Legacy exports for backward compatibility
export const isAbortError = AbortHandler.isAbortError;
export const handleAbortError = (error: any, operationName?: string) => {
  return AbortHandler.handleError(error, operationName || 'Operation');
};
