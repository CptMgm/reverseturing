import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
            <p className="text-xl mb-4">
              The 3D scene encountered an error. This might be due to browser compatibility or performance issues.
            </p>
            <details className="bg-gray-900 p-4 rounded mb-4">
              <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
              <pre className="text-sm overflow-auto text-red-400">
                {this.state.error?.toString()}
              </pre>
            </details>
            <div className="space-y-2">
              <p className="font-semibold">Try these solutions:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Refresh the page</li>
                <li>Use Chrome or Edge browser for best compatibility</li>
                <li>Update your graphics drivers</li>
                <li>Try switching to Classic mode in App.jsx</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
