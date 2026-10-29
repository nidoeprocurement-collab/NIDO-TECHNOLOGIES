import React from "react";

type PageErrorBoundaryProps = {
  children: React.ReactNode;
  title?: string;
  resetKey?: string;
};

type PageErrorBoundaryState = {
  error: Error | null;
};

export default class PageErrorBoundary extends React.Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.title || "Page"}] render failed`, error, info.componentStack);
  }

  componentDidUpdate(previousProps: PageErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      const showErrorDetails =
        import.meta.env.DEV
        || window.location.hostname === "localhost"
        || window.location.hostname.endsWith(".replit.dev");

      return (
        <main className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-5 py-12">
          <section
            role="alert"
            className="w-full rounded-xl border border-red-200 bg-white p-6 shadow-sm"
          >
            <h1 className="text-lg font-semibold text-gray-900">
              {this.props.title || "This page could not be loaded"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Refresh the page and try again. If the problem continues, contact your administrator.
            </p>
            {showErrorDetails && (
              <details open className="mt-4 rounded-lg bg-red-50 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-red-800">
                  Development error details
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-red-900">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Refresh page
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
