import { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { Node } from '@patternfly/react-topology';
import { Trans, useTranslation } from 'react-i18next';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { launchErrorModal } from '@console/shared/src/utils/error-modal-handler';
import { updateTopologyResourceApplication } from './topology-utils';

// Context for move node confirmation handler
type MoveNodeHandlersContextType = {
  confirmMove: (title: string, message: ReactNode, confirmButtonText: string) => Promise<void>;
} | null;

const MoveNodeHandlersContext = createContext<MoveNodeHandlersContextType>(null);

/**
 * Provider component that sets up error and confirmation handlers for moveNodeToGroup.
 * This should wrap the Topology component.
 *
 * @example
 * ```tsx
 * <MoveNodeHandlersProvider>
 *   <Topology />
 * </MoveNodeHandlersProvider>
 * ```
 */
export const MoveNodeHandlersProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const launchWarningModal = useWarningModal();

  const confirmMove = useCallback(
    (title: string, message: ReactNode, confirmButtonText: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        launchWarningModal({
          title: t(`topology~${title}`),
          children: message,
          confirmButtonLabel: t(`topology~${confirmButtonText}`),
          onConfirm: () => {
            resolve();
          },
          onClose: () => {
            reject(new Error('User cancelled'));
          },
        });
      });
    },
    [launchWarningModal, t],
  );

  const value = { confirmMove };

  return (
    <MoveNodeHandlersContext.Provider value={value}>{children}</MoveNodeHandlersContext.Provider>
  );
};

/**
 * Hook to access move node handlers from within components.
 * Must be used within MoveNodeHandlersProvider.
 *
 * @throws {Error} If used outside of MoveNodeHandlersProvider
 */
export const useMoveNodeHandlers = () => {
  const context = useContext(MoveNodeHandlersContext);
  if (!context) {
    throw new Error('useMoveNodeHandlers must be used within MoveNodeHandlersProvider');
  }
  return context;
};

// Module-level reference for non-React contexts (drag-drop callbacks)
// This is populated by SyncMoveNodeHandlers and should not be set directly
let moduleHandlers: MoveNodeHandlersContextType = null;

/**
 * Component that syncs the move node handlers to module-level for non-React contexts.
 * This should be mounted once inside MoveNodeHandlersProvider.
 *
 * @example
 * ```tsx
 * <MoveNodeHandlersProvider>
 *   <SyncMoveNodeHandlers />
 *   <Topology />
 * </MoveNodeHandlersProvider>
 * ```
 */
export const SyncMoveNodeHandlers = () => {
  const handlers = useMoveNodeHandlers();

  useEffect(() => {
    moduleHandlers = handlers;
    return () => {
      moduleHandlers = null;
    };
  }, [handlers]);

  return null;
};

/**
 * Move a node to a different group or remove it from its current group.
 * This function can be called from non-React contexts (drag-drop callbacks).
 *
 * @param node - The node to move
 * @param targetGroup - The target group, or null to remove from current group
 * @param onError - Optional custom error handler
 * @returns Promise that resolves when move is complete
 *
 * @example
 * ```typescript
 * // In a drag-drop callback
 * try {
 *   await moveNodeToGroup(node, targetGroup);
 * } catch (err) {
 *   // User cancelled or error occurred
 * }
 * ```
 */
export const moveNodeToGroup = async (
  node: Node,
  targetGroup: Node | null,
  onError?: (error: string) => void,
): Promise<void> => {
  const sourceGroup = node.getParent() !== node.getGraph() ? (node.getParent() as Node) : undefined;

  if (sourceGroup === targetGroup) {
    throw new Error('Source and target are the same');
  }

  const handlers = moduleHandlers;
  if (!handlers) {
    throw new Error(
      'Move node handlers not initialized. Ensure MoveNodeHandlersProvider is mounted.',
    );
  }

  // If moving from a group, show confirmation
  if (sourceGroup) {
    const nodeLabel = node.getLabel();
    const sourceLabel = sourceGroup.getLabel();
    const targetLabel = targetGroup?.getLabel();

    // t('topology~Move component node')
    // t('topology~Remove component node from application')
    const title = targetGroup ? 'Move component node' : 'Remove component node from application';

    const message = targetGroup ? (
      <Trans ns="topology">
        Are you sure you want to move <strong>{{ nodeLabel }}</strong> from {{ sourceLabel }} to{' '}
        {{ targetLabel }}?
      </Trans>
    ) : (
      <Trans ns="topology">
        Are you sure you want to remove <strong>{{ nodeLabel }}</strong> from {{ sourceLabel }}?
      </Trans>
    );

    // t('topology~Move')
    // t('topology~Remove')
    const confirmButtonText = targetGroup ? 'Move' : 'Remove';

    try {
      // Blur active element to prevent aria-hidden focus violations when modal opens
      // This is necessary when called from drag-drop operations where focus may be on SVG elements
      if (
        document.activeElement instanceof HTMLElement ||
        document.activeElement instanceof SVGElement
      ) {
        document.activeElement.blur();
      }

      // Wait for user confirmation
      await handlers.confirmMove(title, message, confirmButtonText);

      // Perform the move
      await updateTopologyResourceApplication(node, targetGroup ? targetGroup.getLabel() : null);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error';

      // Only show error modal if it's not a cancellation
      if (errorMessage !== 'User cancelled') {
        if (onError) {
          onError(errorMessage);
        } else {
          launchErrorModal({ error: errorMessage });
        }
      }

      throw err;
    }
  } else {
    // No source group, just perform the move without confirmation
    try {
      await updateTopologyResourceApplication(node, targetGroup?.getLabel() || null);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error';
      if (onError) {
        onError(errorMessage);
      } else {
        launchErrorModal({ error: errorMessage });
      }
      throw err;
    }
  }
};

/**
 * @deprecated Use MoveNodeHandlersProvider instead
 * Hook that sets up both error and confirm handling for moveNodeToGroup using useOverlay.
 */
export const useSetupMoveNodeToGroupHandlers = () => {
  const { t } = useTranslation();
  const launchWarningModal = useWarningModal();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.warn(
      'useSetupMoveNodeToGroupHandlers is deprecated. Use MoveNodeHandlersProvider instead.',
    );

    const handlers = {
      confirmMove: (title: string, message: ReactNode, confirmButtonText: string) => {
        return new Promise<void>((resolve, reject) => {
          launchWarningModal({
            title: t(`topology~${title}`),
            children: message,
            confirmButtonLabel: t(`topology~${confirmButtonText}`),
            onConfirm: () => resolve(),
            onClose: () => reject(new Error('User cancelled')),
          });
        });
      },
    };

    moduleHandlers = handlers;

    return () => {
      moduleHandlers = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * @deprecated Use MoveNodeHandlersProvider instead
 * Hook that sets up error handling for moveNodeToGroup using useOverlay.
 * Note: Error handling is now done via the shared launchErrorModal() function.
 */
export const useSetupMoveNodeToGroupErrorHandler = () => {
  const launchWarningModal = useWarningModal();
  const { t } = useTranslation();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.warn(
      'useSetupMoveNodeToGroupErrorHandler is deprecated. Use MoveNodeHandlersProvider instead.',
    );

    const handlers = {
      confirmMove: (title: string, message: ReactNode, confirmButtonText: string) => {
        return new Promise<void>((resolve, reject) => {
          launchWarningModal({
            title: t(`topology~${title}`),
            children: message,
            confirmButtonLabel: t(`topology~${confirmButtonText}`),
            onConfirm: () => resolve(),
            onClose: () => reject(new Error('User cancelled')),
          });
        });
      },
    };

    moduleHandlers = handlers;

    return () => {
      moduleHandlers = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * @deprecated Use moveNodeToGroup directly instead
 * Hook that provides a moveNodeToGroup function with error handling.
 * Note: Errors are now handled automatically via launchErrorModal().
 */
export const useMoveNodeToGroup = () => {
  return useCallback((node: Node, targetGroup: Node | null) => {
    return moveNodeToGroup(node, targetGroup);
  }, []);
};
