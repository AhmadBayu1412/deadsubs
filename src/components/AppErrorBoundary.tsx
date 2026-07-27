// Phase 11 — App-level error boundary
// Catches React component errors and renders a safe fallback.
// Boundaries are the only React mechanism for catching render errors.
import { Component, type ReactNode } from 'react';
import { Button } from './ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
          <div className="max-w-sm w-full bg-surface rounded-xl border border-border p-8 flex flex-col items-center text-center gap-4">
            <div className="p-3 rounded-full bg-accent-red-light">
              <AlertCircle className="w-8 h-8 text-accent-red" />
            </div>
            <div>
              <p className="text-base font-semibold text-primary">Something went wrong</p>
              <p className="text-sm text-secondary mt-1">
                {this.state.error?.message ?? 'An unexpected error occurred.'}
              </p>
            </div>
            <Button variant="primary" onClick={this.handleReset}>
              <RefreshCw className="w-4 h-4" />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
