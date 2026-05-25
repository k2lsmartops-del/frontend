import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-k2l-gray-100 p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-k2l-red-light">
            <svg className="h-8 w-8 text-k2l-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mb-2 font-head text-lg font-semibold text-k2l-gray-900">
            Une erreur est survenue
          </h1>
          <p className="mb-6 text-sm text-k2l-gray-600">
            L'application a rencontré un problème inattendu.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-k2l-primary px-6 py-3 text-sm font-medium text-white"
          >
            Recharger l'application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
