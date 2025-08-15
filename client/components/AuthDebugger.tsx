/**
 * Authentication Debugging Component
 * Helps track and debug authentication issues in production
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAuthState, resetAuthState } from '@/utils/isolatedAuth';

interface AuthDebuggerProps {
  isVisible?: boolean;
}

export function AuthDebugger({ isVisible = false }: AuthDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      const authState = getAuthState();
      setDebugInfo({
        ...authState,
        timestamp: new Date().toISOString(),
        responseCount: (window as any).__authResponseCount || 0,
        fetchCalls: (window as any).__authFetchCalls || 0,
      });
    }, 1000);
    
    // Listen for auth-related console logs
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('🔐') || message.includes('ISOLATED')) {
        setLogs(prev => [...prev.slice(-10), `${new Date().toISOString()}: ${message}`]);
      }
      originalConsoleLog.apply(console, args);
    };
    
    return () => {
      clearInterval(interval);
      console.log = originalConsoleLog;
    };
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-hidden shadow-lg border-2 border-red-200 z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          🔐 Auth Debugger
          <div className="flex gap-1">
            <Badge variant={debugInfo.isAuthenticating ? "destructive" : "secondary"}>
              {debugInfo.isAuthenticating ? "ACTIVE" : "IDLE"}
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => resetAuthState()}
              className="h-6 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="space-y-1">
          <div>Auth State: {debugInfo.isAuthenticating ? '🟡 Authenticating' : '🟢 Ready'}</div>
          <div>Promise: {debugInfo.hasCurrentPromise ? '🟡 Active' : '🟢 None'}</div>
          <div>Responses: {debugInfo.responseCount}</div>
          <div>Fetch Calls: {debugInfo.fetchCalls}</div>
        </div>
        
        <div className="border-t pt-2">
          <div className="font-semibold mb-1">Recent Logs:</div>
          <div className="max-h-32 overflow-y-auto text-xs font-mono bg-gray-50 p-1 rounded">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="whitespace-nowrap truncate">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          Last update: {debugInfo.timestamp?.split('T')[1]?.slice(0, 8)}
        </div>
      </CardContent>
    </Card>
  );
}

// Global function to enable debugger (can be called from console)
(window as any).enableAuthDebugger = () => {
  const event = new CustomEvent('enableAuthDebugger');
  window.dispatchEvent(event);
};

(window as any).disableAuthDebugger = () => {
  const event = new CustomEvent('disableAuthDebugger');
  window.dispatchEvent(event);
};
