'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Algo salió mal
          </h2>
          <p className="text-red-600 mb-4 text-center">
            {this.state.error?.message || 'Se produjo un error inesperado'}
          </p>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para manejar valores undefined/null de forma segura
export function useSafeValue<T>(value: T | undefined | null, defaultValue: T): T {
  return value ?? defaultValue;
}

// Utilidad para formatear números de forma segura
export function safeToFixed(value: number | undefined | null, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.0';
  }
  return value.toFixed(decimals);
}

// Utilidad para formatear porcentajes de forma segura
export function safePercentage(value: number | undefined | null): string {
  return safeToFixed(value, 1) + '%';
}




