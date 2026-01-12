import { createClient } from '@/lib/supabase/client'

interface ErrorLog {
  error_type: 'loading_timeout' | 'api_error' | 'react_error' | 'unhandled_error'
  message: string
  page_url: string
  component?: string
  user_id?: string
  metadata?: Record<string, any>
}

class ClientMonitoring {
  private supabase = createClient()
  private loadingTimers: Map<string, NodeJS.Timeout> = new Map()
  private readonly LOADING_TIMEOUT_MS = 15000 // 15 seconds

  /**
   * Start tracking a loading state. If it doesn't complete within timeout, log an error.
   */
  startLoadingTimer(componentId: string, componentName: string): void {
    // Clear any existing timer for this component
    this.clearLoadingTimer(componentId)

    const timer = setTimeout(() => {
      this.logError({
        error_type: 'loading_timeout',
        message: `Loading state stuck for ${this.LOADING_TIMEOUT_MS / 1000}s`,
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        component: componentName,
        metadata: {
          timeout_ms: this.LOADING_TIMEOUT_MS,
          componentId,
        },
      })
    }, this.LOADING_TIMEOUT_MS)

    this.loadingTimers.set(componentId, timer)
  }

  /**
   * Clear a loading timer (call when loading completes successfully)
   */
  clearLoadingTimer(componentId: string): void {
    const timer = this.loadingTimers.get(componentId)
    if (timer) {
      clearTimeout(timer)
      this.loadingTimers.delete(componentId)
    }
  }

  /**
   * Log an API error (e.g., 406, 500, network errors)
   */
  logApiError(error: Error | string, endpoint: string, statusCode?: number): void {
    this.logError({
      error_type: 'api_error',
      message: typeof error === 'string' ? error : error.message,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      metadata: {
        endpoint,
        statusCode,
        stack: error instanceof Error ? error.stack : undefined,
      },
    })
  }

  /**
   * Log a React error (from ErrorBoundary)
   */
  logReactError(error: Error, errorInfo: { componentStack: string }): void {
    this.logError({
      error_type: 'react_error',
      message: error.message,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      metadata: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    })
  }

  /**
   * Log an unhandled error
   */
  logUnhandledError(error: Error | string): void {
    this.logError({
      error_type: 'unhandled_error',
      message: typeof error === 'string' ? error : error.message,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      metadata: {
        stack: error instanceof Error ? error.stack : undefined,
      },
    })
  }

  /**
   * Internal method to log errors to Supabase
   */
  private async logError(errorLog: ErrorLog): Promise<void> {
    try {
      // Get current user if available
      const { data: { user } } = await this.supabase.auth.getUser()

      const { error } = await this.supabase
        .from('client_errors')
        .insert({
          error_type: errorLog.error_type,
          message: errorLog.message,
          page_url: errorLog.page_url,
          component: errorLog.component || null,
          user_id: user?.id || null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          metadata: errorLog.metadata || {},
        })

      if (error) {
        console.error('Failed to log error to Supabase:', error)
      }
    } catch (err) {
      // Don't throw - we don't want error logging to break the app
      console.error('Error logging failed:', err)
    }
  }
}

// Singleton instance
export const monitoring = new ClientMonitoring()

// Hook for React components
import { useEffect, useRef } from 'react'

export function useLoadingMonitor(componentName: string, isLoading: boolean): void {
  const componentId = useRef(`${componentName}-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    if (isLoading) {
      monitoring.startLoadingTimer(componentId.current, componentName)
    } else {
      monitoring.clearLoadingTimer(componentId.current)
    }

    return () => {
      monitoring.clearLoadingTimer(componentId.current)
    }
  }, [isLoading, componentName])
}
