import { useCallback, useEffect } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ErrorModalProps } from '@console/internal/components/modals/error-modal';
import { ErrorModal } from '@console/internal/components/modals/error-modal';

// Module-level reference for non-React contexts
// This is populated by SyncErrorModalLauncher and should not be set directly
let moduleErrorModalLauncher: ((props: ErrorModalProps) => void) | null = null;

/**
 * Component that syncs the error modal launcher to module-level for non-React contexts.
 * This should be mounted once in the app root, after OverlayProvider.
 *
 * @example
 * ```tsx
 * const App = () => (
 *   <OverlayProvider>
 *     <SyncErrorModalLauncher />
 *     <YourApp />
 *   </OverlayProvider>
 * );
 * ```
 */
export const SyncErrorModalLauncher = () => {
  const launcher = useOverlay();

  useEffect(() => {
    moduleErrorModalLauncher = (props: ErrorModalProps) => {
      launcher<ErrorModalProps>(ErrorModal, props);
    };

    return () => {
      moduleErrorModalLauncher = null;
    };
  }, [launcher]);

  return null;
};

/**
 * Hook to launch error modals from React components.
 * Must be used within an OverlayProvider.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const launchErrorModal = useErrorModalLauncher();
 *
 *   const handleError = (error: Error) => {
 *     launchErrorModal({
 *       title: 'Operation Failed',
 *       error: error.message,
 *     });
 *   };
 *
 *   // ...
 * };
 * ```
 */
export const useErrorModalLauncher = (): ((props: ErrorModalProps) => void) => {
  const launcher = useOverlay();

  return useCallback(
    (props: ErrorModalProps) => {
      launcher<ErrorModalProps>(ErrorModal, props);
    },
    [launcher],
  );
};

/**
 * Launch an error modal from non-React contexts (callbacks, promises, utilities).
 * The SyncErrorModalLauncher component must be mounted in the app root.
 *
 * @deprecated Use React component modals within component code instead.
 * For new code, write modals directly within React components using useOverlay or other modal patterns.
 * This function should only be used for legacy non-React contexts like promise callbacks.
 *
 * @example
 * ```tsx
 * // In a promise callback or utility function
 * createConnection(source, target).catch((error) => {
 *   launchErrorModal({
 *     title: 'Connection Failed',
 *     error: error.message,
 *   });
 * });
 * ```
 */
export const launchErrorModal = (props: ErrorModalProps): void => {
  if (moduleErrorModalLauncher) {
    moduleErrorModalLauncher(props);
  } else {
    // eslint-disable-next-line no-console
    console.error(
      'Error modal launcher not initialized. Ensure SyncErrorModalLauncher is mounted after OverlayProvider.',
      props,
    );
  }
};
