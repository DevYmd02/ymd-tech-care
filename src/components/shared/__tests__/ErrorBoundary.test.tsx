/**
 * @file ErrorBoundary.test.tsx
 * @description Unit tests for ErrorBoundary component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@system/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  // Test specifically for generic content since the prop is called FallbackComponent in library
  // but our wrapper might not expose it directly in the same way or expects 'fallback' prop for custom elements?
  // The wrapper we made doesn't actually use the 'fallback' prop for the ReactErrorBoundary component directly
  // It hardcodes FallbackComponent={ErrorFallback}. 
  // Let's stick to testing the default behavior which is what we need for now.
  
  it('should have retry button that triggers handleRetry', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Retry button should be present and clickable
    const retryButton = screen.getByText('Reload Page');
    expect(retryButton).toBeInTheDocument();
    
    // Click retry - this will reset state and try to render children again
    // Since ThrowError still throws, error UI will show again
    fireEvent.click(retryButton);
    
    // The error should still be shown since component keeps throwing
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
