/**
 * Mock for warning-modal-handler
 * Used in Jest tests to avoid rendering actual modals
 */

export const mockLaunchWarningModal = jest.fn(() => Promise.resolve());

export const useSyncWarningModalLauncher = jest.fn();

export const useWarningModalLauncher = jest.fn(() => mockLaunchWarningModal);

export const launchWarningModal = mockLaunchWarningModal;
