import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { RootState } from '@console/internal/redux';
import { k8sKill, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import {
  ALL_NAMESPACES_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
  useUserSettingsCompatibility,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { getActiveNamespace } from '../../reducers/ui';
import { setActiveNamespace, formatNamespaceRoute } from '../../actions/ui';

export const DeleteNamespaceModal: React.FC<DeleteNamespaceModalProps> = ({
  cancel,
  close,
  kind,
  resource,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [confirmed, setConfirmed] = React.useState(false);

  /**
   * This is a workaround because modal launcher renders all modals outside of main app context.
   * This leads to namespace context not being available in modal so we access the redux store and use settings directly as a workaround.
   *  */
  const dispatch = useDispatch();
  const activeNamespace = useSelector((state: RootState) => getActiveNamespace(state));
  const [, setLastNamespace] = useUserSettingsCompatibility<string>(
    LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
    LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  );

  const onSubmit = (event) => {
    event.preventDefault();
    handlePromise(k8sKill(kind, resource))
      .then(() => {
        if (resource.metadata.name === activeNamespace) {
          if (ALL_NAMESPACES_KEY !== activeNamespace) {
            const oldPath = window.location.pathname;
            const newPath = formatNamespaceRoute(ALL_NAMESPACES_KEY, oldPath, window.location);
            if (newPath !== oldPath) {
              navigate(newPath);
            }
          }
          dispatch(setActiveNamespace(ALL_NAMESPACES_KEY));
          setLastNamespace(ALL_NAMESPACES_KEY);
        }
        close?.();
        navigate(`/k8s/cluster/${kind.plural}`);
      })
      .catch(() => {
        /* do nothing */
      });
  };

  const onKeyUp = (e) => {
    setConfirmed(e.currentTarget.value === resource.metadata.name);
  };

  return (
    <form onSubmit={onSubmit} name="form" className="modal-content">
      <ModalTitle className="modal-header">
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('public~Delete {{label}}?', { label: t(kind.labelKey) })}
      </ModalTitle>
      <ModalBody>
        <p>
          <Trans t={t} ns="public">
            This action cannot be undone. It will destroy all pods, services and other objects in
            the namespace{' '}
            <strong className="co-break-word">{{ name: resource.metadata.name }}</strong>.
          </Trans>
        </p>
        <p>
          <Trans t={t} ns="public">
            Confirm deletion by typing{' '}
            <strong className="co-break-word">{{ name: resource.metadata.name }}</strong> below:
          </Trans>
        </p>
        <span className="pf-v6-c-form-control">
          <input
            type="text"
            data-test="project-name-input"
            onKeyUp={onKeyUp}
            placeholder={t('public~Enter name')}
            aria-label={t('public~Enter the name of the {{label}} to delete', {
              label: t(kind.labelKey),
            })}
            autoFocus={true}
          />
        </span>
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('public~Delete')}
        submitDisabled={!confirmed}
        cancel={() => cancel?.()}
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitDanger
      />
    </form>
  );
};

export const deleteNamespaceModal = createModalLauncher(DeleteNamespaceModal);

type DeleteNamespaceModalProps = {
  resource: K8sResourceKind;
  kind: K8sKind;
} & ModalComponentProps;
