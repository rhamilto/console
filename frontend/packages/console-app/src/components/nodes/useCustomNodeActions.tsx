import { useMemo, useCallback } from 'react';
import { DropdownItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { NodeKind } from '@console/internal/module/k8s';
import { ResponsiveActionDropdown } from '@console/shared/src/components/dropdown/ResponsiveActionDropdown';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { isNodeUnschedulable } from '@console/shared/src/selectors/node';
import { makeNodeSchedulable, makeNodeUnschedulable } from '../../k8s/requests/nodes';

type UseCustomNodeActionsOptions = {
  selectedNodes: NodeKind[];
  onComplete: () => void;
};

/**
 * Hook for custom node actions dropdown.
 * Returns a ResponsiveActionDropdown that should be used with customActions prop.
 * Shows as primary button on desktop (md breakpoint and above), kebab button on mobile.
 */
export const useCustomNodeActions = ({
  selectedNodes,
  onComplete,
}: UseCustomNodeActionsOptions) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress] = usePromiseHandler();

  const { schedulableCount, unschedulableCount } = useMemo(() => {
    let schedulable = 0;
    let unschedulable = 0;
    selectedNodes.forEach((node) => {
      if (isNodeUnschedulable(node)) {
        unschedulable++;
      } else {
        schedulable++;
      }
    });
    return { schedulableCount: schedulable, unschedulableCount: unschedulable };
  }, [selectedNodes]);

  const handleMarkSchedulable = useCallback(() => {
    const promises = selectedNodes
      .filter((node) => isNodeUnschedulable(node))
      .map((node) => makeNodeSchedulable(node));

    handlePromise(
      Promise.allSettled(promises).then((results) => {
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          throw new Error(
            t(
              'console-app~Failed to mark {{failureCount}} of {{totalCount}} nodes as schedulable',
              { failureCount: failures.length, totalCount: results.length },
            ),
          );
        }
      }),
    )
      .then(() => {
        onComplete();
      })
      .catch(() => {
        // Errors are handled by usePromiseHandler
      });
  }, [selectedNodes, handlePromise, t, onComplete]);

  const handleMarkUnschedulable = useCallback(() => {
    const promises = selectedNodes
      .filter((node) => !isNodeUnschedulable(node))
      .map((node) => makeNodeUnschedulable(node));

    handlePromise(
      Promise.allSettled(promises).then((results) => {
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          throw new Error(
            t(
              'console-app~Failed to mark {{failureCount}} of {{totalCount}} nodes as unschedulable',
              { failureCount: failures.length, totalCount: results.length },
            ),
          );
        }
      }),
    )
      .then(() => {
        onComplete();
      })
      .catch(() => {
        // Errors are handled by usePromiseHandler
      });
  }, [selectedNodes, handlePromise, t, onComplete]);

  return useMemo(() => {
    const dropdownItems: JSX.Element[] = [];

    if (unschedulableCount > 0) {
      dropdownItems.push(
        <DropdownItem
          key="mark-schedulable"
          onClick={handleMarkSchedulable}
          isDisabled={inProgress}
          data-test="bulk-mark-schedulable"
          description={t(
            'console-app~Applies to {{nodeCount}} selected node(s) that are currently unschedulable.',
            { nodeCount: unschedulableCount },
          )}
        >
          {t('console-app~Mark schedulable')}
        </DropdownItem>,
      );
    }

    if (schedulableCount > 0) {
      dropdownItems.push(
        <DropdownItem
          key="mark-unschedulable"
          onClick={handleMarkUnschedulable}
          isDisabled={inProgress}
          data-test="bulk-mark-unschedulable"
          description={t(
            'console-app~Applies to {{nodeCount}} selected node(s) that are currently schedulable.',
            { nodeCount: schedulableCount },
          )}
        >
          {t('console-app~Mark unschedulable')}
        </DropdownItem>,
      );
    }

    const hasNoApplicableActions = dropdownItems.length === 0;
    const isDisabled = inProgress || selectedNodes.length === 0 || hasNoApplicableActions;

    return (
      <ResponsiveActionDropdown
        label={t('console-app~Scheduling')}
        isDisabled={isDisabled}
        data-test="bulk-actions-dropdown"
      >
        {dropdownItems}
      </ResponsiveActionDropdown>
    );
  }, [
    unschedulableCount,
    schedulableCount,
    inProgress,
    selectedNodes.length,
    t,
    handleMarkSchedulable,
    handleMarkUnschedulable,
  ]);
};
