import type { FC } from 'react';
import { useState, useEffect } from 'react';
import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalComponentProps } from '@console/internal/components/factory/modal';
import { NodeKind } from '@console/internal/module/k8s';
import { ModalErrorContent } from '@console/shared/src/components/modal-error-content';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { makeNodeUnschedulable } from '../../../k8s/requests/nodes';

type ConfigureUnschedulableModalProps = {
  resource: NodeKind;
} & ModalComponentProps;

const ConfigureUnschedulableModal: FC<ConfigureUnschedulableModalProps> = ({
  resource,
  close,
  cancel,
}) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const handleSubmit = (event): void => {
    event.preventDefault();
    handlePromise(makeNodeUnschedulable(resource))
      .then(() => close())
      .catch(() => {});
  };
  const { t } = useTranslation();
  return (
    <>
      <ModalHeader title={t('console-app~Mark as unschedulable')} />
      <ModalBody>
        <Form id="configure-unschedulable-form" onSubmit={handleSubmit}>
          {t(
            "console-app~Unschedulable nodes won't accept new pods. This is useful for scheduling maintenance or preparing to decommission a node.",
          )}
        </Form>
      </ModalBody>
      <ModalFooter className="pf-v6-u-flex-wrap">
        <ModalErrorContent errorMessage={errorMessage} />
        <Button
          variant="primary"
          type="submit"
          form="configure-unschedulable-form"
          isLoading={inProgress}
          isDisabled={inProgress}
        >
          {t('console-app~Mark unschedulable')}
        </Button>
        <Button variant="link" onClick={cancel}>
          {t('console-app~Cancel')}
        </Button>
      </ModalFooter>
    </>
  );
};

export const ConfigureUnschedulableModalOverlay: OverlayComponent<ConfigureUnschedulableModalProps> = (
  props,
) => {
  const [isOpen, setIsOpen] = useState(true);

  // Move focus away from the triggering element to prevent aria-hidden warning
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <ConfigureUnschedulableModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};
