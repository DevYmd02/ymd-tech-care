/**
 * @file ErrorBoundary.test.tsx
 * @description Unit tests for ErrorBoundary component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

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

    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    expect(screen.getByText('ลองใหม่')).toBeInTheDocument();
    expect(screen.getByText('กลับหน้าแรก')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('should have retry button that triggers handleRetry', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be shown
    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();

    // Retry button should be present and clickable
    const retryButton = screen.getByText('ลองใหม่');
    expect(retryButton).toBeInTheDocument();
    
    // Click retry - this will reset state and try to render children again
    // Since ThrowError still throws, error UI will show again
    fireEvent.click(retryButton);
    
    // The error should still be shown since component keeps throwing
    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
  });
});
