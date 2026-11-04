import React from 'react';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  resetKey?: string;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk') ||
    message.includes('Unable to preload CSS')
  );
}

export default class PageErrorBoundary extends React.Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PageErrorBoundary]', error, errorInfo);
    if (isChunkLoadError(error)) {
      const reloadKey = `nido_chunk_reload_${window.location.pathname}`;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
      }
    }
  }

  componentDidUpdate(prevProps: PageErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {this.props.title || 'Something went wrong loading this page'}
            </h2>
            {this.state.error?.message && (
              <p className="mt-2 text-xs text-slate-500 break-words">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
