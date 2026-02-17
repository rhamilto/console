import { useCallback, useEffect } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ControlledWarningModalProps } from '../hooks/useWarningModal';
import { ControlledWarningModal } from '../hooks/useWarningModal';

// Module-level reference for non-React contexts
// This is populated by useSyncWarningModalLauncher and should not be set directly
let moduleWarningModalLauncher: ((props: ControlledWarningModalProps) => void) | null = null;

/**
 * Hook that syncs the warning modal launcher to module-level for non-React contexts.
 * This should be called once in the app root, after OverlayProvider.
 * Use SyncModalLaunchers component from error-modal-handler instead of calling this directly.
 */
export const useSyncWarningModalLauncher = () => {
  const launcher = useOverlay();

  useEffect(() => {
    const warningModalLauncher = (props: ControlledWarningModalProps) => {
      launcher<ControlledWarningModalProps>(ControlledWarningModal, props);
    };
    moduleWarningModalLauncher = warningModalLauncher;

    return () => {
      // Only clear if we're still the active launcher
      if (moduleWarningModalLauncher === warningModalLauncher) {
        moduleWarningModalLauncher = null;
      }
    };
  }, [launcher]);
};

/**
 * Hook to launch warning modals from React components.
 * Must be used within an OverlayProvider.
 * Use `useWarningModal` instead for better React integration.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const launchWarningModal = useWarningModalLauncher();
 *
 *   const handleWarning = () => {
 *     launchWarningModal({
 *       title: 'Are you sure?',
 *       children: 'This action cannot be undone.',
 *       confirmButtonLabel: 'Continue',
 *       onConfirm: () => console.log('Confirmed'),
 *     });
 *   };
 *
 *   // ...
 * };
 * ```
 */
export const useWarningModalLauncher = (): ((props: ControlledWarningModalProps) => void) => {
  const launcher = useOverlay();

  return useCallback(
    (props: ControlledWarningModalProps) => {
      launcher<ControlledWarningModalProps>(ControlledWarningModal, props);
    },
    [launcher],
  );
};

/**
 * Launch a warning modal from non-React contexts (callbacks, promises, utilities).
 * The SyncWarningModalLauncher component must be mounted in the app root.
 *
 * @deprecated Use React component modals within component code instead.
 * For new code, write modals directly within React components using useWarningModal.
 * This function should only be used for legacy non-React contexts like promise callbacks.
 *
 * @param props - Warning modal properties (title, children, confirmButtonLabel, etc.)
 * @returns Promise that resolves (undefined) when confirmed, rejects with Error('User cancelled') when canceled/closed
 *
 * @example
 * ```tsx
 * // In a promise callback or utility function
 * launchWarningModal({
 *   title: 'Delete Resource',
 *   children: 'Are you sure you want to delete this resource?',
 *   confirmButtonLabel: 'Delete',
 * }).then(() => {
 *   // User confirmed - proceed with action
 *   deleteResource();
 * }).catch((error) => {
 *   // User canceled - error.message === 'User cancelled'
 *   console.log('Action cancelled by user');
 * });
 * ```
 */
export const launchWarningModal = (
  props: Omit<ControlledWarningModalProps, 'onConfirm' | 'onClose'>,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (moduleWarningModalLauncher) {
      moduleWarningModalLauncher({
        ...props,
        onConfirm: () => {
          resolve();
        },
        onClose: () => {
          reject(new Error('User cancelled'));
        },
      });
    } else {
      throw new Error(
        'Warning modal launcher not initialized. Ensure SyncWarningModalLauncher is mounted after OverlayProvider.',
      );
    }
  });
};
