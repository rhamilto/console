/**
 * Mock implementation of error-modal-handler for Jest tests
 */

export const mockLaunchErrorModal = jest.fn();

export const SyncErrorModalLauncher = () => null;

export const useErrorModalLauncher = jest.fn(() => mockLaunchErrorModal);

export const launchErrorModal = mockLaunchErrorModal;
