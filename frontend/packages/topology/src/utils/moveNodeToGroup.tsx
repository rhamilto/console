import { Node } from '@patternfly/react-topology';
import { Trans } from 'react-i18next';
import { confirmModal } from '@console/internal/components/modals';
import { launchErrorModal } from '@console/shared/src/utils/error-modal-handler';
import { updateTopologyResourceApplication } from './topology-utils';

export const moveNodeToGroup = (
  node: Node,
  targetGroup: Node,
  onError?: (error: string) => void,
): Promise<void> => {
  const sourceGroup = node.getParent() !== node.getGraph() ? (node.getParent() as Node) : undefined;
  if (sourceGroup === targetGroup) {
    return Promise.reject();
  }

  if (sourceGroup) {
    // t('topology~Move component node')
    // t('topology~Remove component node from application')
    const titleKey = targetGroup
      ? 'topology~Move component node'
      : 'topology~Remove component node from application';
    const nodeLabel = node.getLabel();
    const sourceLabel = sourceGroup.getLabel();
    const targetLabel = targetGroup?.getLabel();
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
    const btnTextKey = targetGroup ? 'topology~Move' : 'topology~Remove';

    return new Promise((resolve, reject) => {
      confirmModal({
        titleKey,
        message,
        btnTextKey,
        close: () => {
          reject();
        },
        cancel: () => {
          reject();
        },
        executeFn: () => {
          return updateTopologyResourceApplication(
            node,
            targetGroup ? targetGroup.getLabel() : null,
          )
            .then(resolve)
            .catch((err) => {
              const error = err.message;
              if (onError) {
                onError(error);
              } else {
                launchErrorModal({ error });
              }
              reject(err);
            });
        },
      });
    });
  }

  return updateTopologyResourceApplication(node, targetGroup.getLabel()).catch((err) => {
    const error = err.message;
    if (onError) {
      onError(error);
    } else {
      launchErrorModal({ error });
    }
  });
};
