import type { NodeKind } from '@console/internal/module/k8s';
import { isNodeUnschedulable } from '@console/shared/src/selectors/node';
import { makeNodeSchedulable, makeNodeUnschedulable } from '../../k8s/requests/nodes';

/**
 * Shared scheduling action logic for nodes.
 * Can be used for both individual node actions and bulk operations.
 */

/**
 * Mark one or more nodes as schedulable.
 * Only affects nodes that are currently unschedulable.
 */
export const markNodesSchedulable = async (nodes: NodeKind | NodeKind[]): Promise<void> => {
  const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
  const unschedulableNodes = nodeArray.filter((node) => isNodeUnschedulable(node));

  if (unschedulableNodes.length === 0) {
    return;
  }

  const promises = unschedulableNodes.map((node) => makeNodeSchedulable(node));
  await Promise.all(promises);
};

/**
 * Mark one or more nodes as unschedulable.
 * Only affects nodes that are currently schedulable.
 */
export const markNodesUnschedulable = async (nodes: NodeKind | NodeKind[]): Promise<void> => {
  const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
  const schedulableNodes = nodeArray.filter((node) => !isNodeUnschedulable(node));

  if (schedulableNodes.length === 0) {
    return;
  }

  const promises = schedulableNodes.map((node) => makeNodeUnschedulable(node));
  await Promise.all(promises);
};

/**
 * Count schedulable vs unschedulable nodes in an array.
 */
export const getSchedulingCounts = (
  nodes: NodeKind[],
): { schedulableCount: number; unschedulableCount: number } => {
  let schedulable = 0;
  let unschedulable = 0;

  nodes.forEach((node) => {
    if (isNodeUnschedulable(node)) {
      unschedulable++;
    } else {
      schedulable++;
    }
  });

  return { schedulableCount: schedulable, unschedulableCount: unschedulable };
};
