import { render } from '@testing-library/react';
import {
  SyncErrorModalLauncher,
  useErrorModalLauncher,
  launchErrorModal,
} from '../error-modal-handler';

// Mock useOverlay
const mockLauncher = jest.fn();
jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: () => mockLauncher,
}));

describe('error-modal-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SyncErrorModalLauncher', () => {
    it('should sync the launcher on mount', () => {
      render(<SyncErrorModalLauncher />);

      // Call the module-level function
      launchErrorModal({ error: 'Test error', title: 'Test' });

      // Should have called the mocked overlay launcher
      expect(mockLauncher).toHaveBeenCalledWith(expect.anything(), {
        error: 'Test error',
        title: 'Test',
      });
    });

    it('should cleanup launcher on unmount', () => {
      const { unmount } = render(<SyncErrorModalLauncher />);

      unmount();

      // Should log error instead of crashing
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      launchErrorModal({ error: 'Test error' });

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error modal launcher not initialized'),
        expect.any(Object),
      );

      consoleError.mockRestore();
    });
  });

  describe('useErrorModalLauncher', () => {
    it('should return a function that launches error modals', () => {
      let capturedLauncher: any;

      const TestComponent = () => {
        capturedLauncher = useErrorModalLauncher();
        return null;
      };

      render(<TestComponent />);

      capturedLauncher({ error: 'Test error', title: 'Test Title' });

      expect(mockLauncher).toHaveBeenCalledWith(expect.anything(), {
        error: 'Test error',
        title: 'Test Title',
      });
    });
  });

  describe('launchErrorModal', () => {
    it('should launch error modal when launcher is initialized', () => {
      render(<SyncErrorModalLauncher />);

      launchErrorModal({
        error: 'Connection failed',
        title: 'Network Error',
      });

      expect(mockLauncher).toHaveBeenCalledWith(expect.anything(), {
        error: 'Connection failed',
        title: 'Network Error',
      });
    });

    it('should log error when launcher is not initialized', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      launchErrorModal({ error: 'Test error' });

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error modal launcher not initialized'),
        { error: 'Test error' },
      );

      consoleError.mockRestore();
    });
  });
});
