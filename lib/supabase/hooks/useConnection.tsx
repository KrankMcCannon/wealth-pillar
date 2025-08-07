/**
 * Supabase Connection Test Hook
 * Provides real-time connection status monitoring
 */

import React, { useState, useEffect } from 'react';
import { testSupabaseConnection, isSupabaseConfigured } from '../index';

export interface ConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  message: string;
  lastChecked: Date | null;
}

export function useSupabaseConnection(autoTest: boolean = true) {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConfigured: false,
    isConnected: false,
    isLoading: false,
    error: null,
    message: 'Not tested',
    lastChecked: null
  });

  const testConnection = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // First check if Supabase is configured
      const configured = isSupabaseConfigured();
      
      if (!configured) {
        setStatus({
          isConfigured: false,
          isConnected: false,
          isLoading: false,
          error: 'Configuration missing',
          message: '⚠️ Supabase not configured. Please check your environment variables.',
          lastChecked: new Date()
        });
        return;
      }

      // Test actual connection
      const result = await testSupabaseConnection();
      
      setStatus({
        isConfigured: true,
        isConnected: result.success,
        isLoading: false,
        error: result.success ? null : result.message,
        message: result.message,
        lastChecked: new Date()
      });
    } catch (error: any) {
      setStatus({
        isConfigured: false,
        isConnected: false,
        isLoading: false,
        error: error.message,
        message: `❌ Connection test failed: ${error.message}`,
        lastChecked: new Date()
      });
    }
  };

  useEffect(() => {
    if (autoTest) {
      testConnection();
    }
  }, [autoTest]);

  return {
    status,
    testConnection,
    isReady: status.isConfigured && status.isConnected
  };
}

// Quick connection check component
export const SupabaseConnectionStatus: React.FC<{ 
  showDetails?: boolean;
  autoRefresh?: number; // milliseconds
}> = ({ 
  showDetails = false, 
  autoRefresh 
}) => {
  const { status, testConnection, isReady } = useSupabaseConnection();

  useEffect(() => {
    if (autoRefresh && autoRefresh > 0) {
      const interval = setInterval(testConnection, autoRefresh);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, testConnection]);

  const getStatusColor = () => {
    if (status.isLoading) return '#f59e0b'; // amber
    if (isReady) return '#10b981'; // green
    return '#ef4444'; // red
  };

  const getStatusIcon = () => {
    if (status.isLoading) return '⏳';
    if (isReady) return '✅';
    return '❌';
  };

  return (
    <div style={{ 
      padding: '12px', 
      border: `2px solid ${getStatusColor()}`, 
      borderRadius: '8px',
      backgroundColor: status.isLoading ? '#fef3c7' : isReady ? '#d1fae5' : '#fee2e2'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {getStatusIcon()} Supabase Connection
        </span>
        <button 
          onClick={testConnection}
          disabled={status.isLoading}
          style={{
            padding: '4px 8px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: getStatusColor(),
            color: 'white',
            cursor: status.isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {status.isLoading ? 'Testing...' : 'Test'}
        </button>
      </div>
      
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
        {status.message}
      </div>
      
      {showDetails && (
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#9ca3af' }}>
          <div>Configured: {status.isConfigured ? '✅' : '❌'}</div>
          <div>Connected: {status.isConnected ? '✅' : '❌'}</div>
          {status.lastChecked && (
            <div>Last checked: {status.lastChecked.toLocaleTimeString()}</div>
          )}
        </div>
      )}
      
      {status.error && (
        <div style={{ 
          marginTop: '8px', 
          padding: '6px', 
          backgroundColor: '#fca5a5', 
          borderRadius: '4px',
          fontSize: '11px',
          color: '#7f1d1d'
        }}>
          {status.error}
        </div>
      )}
    </div>
  );
};
