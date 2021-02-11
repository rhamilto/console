import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import { SubscriptionKind } from '../../types';
import { ConsoleModel } from '@console/internal/models';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import { getPluginIsEnabled, getPluginPatch } from '../../utils';
import { ConsolePluginWarning } from '../../utils/consolePluginWarning';
import { ConsolePluginRadioInputs } from '../../utils/consolePluginRadioInputs';

export const ConsolePluginModal = withHandlePromise((props: ConsolePluginModalProps) => {
  const {
    cancel,
    close,
    consoleOperator,
    errorMessage,
    handlePromise,
    inProgress,
    plugin,
    subscription,
  } = props;
  const previouslyEnabled = getPluginIsEnabled(consoleOperator, plugin);
  const { t } = useTranslation();
  const [enabled, setEnabled] = React.useState(previouslyEnabled);
  const submit = (event) => {
    event.preventDefault();
    const patch = getPluginPatch(consoleOperator, plugin, enabled);
    const promise = k8sPatch(ConsoleModel, consoleOperator, [patch]);
    handlePromise(promise, close);
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{t('olm~Console UI extension')}</ModalTitle>
      <ModalBody>
        <p>
          {t(
            'olm~This operator provides a custom interface you can include in your console.  Make sure you trust this opeartor before enabling its interface.',
          )}
        </p>
        <ConsolePluginRadioInputs autofocus name={plugin} enabled={enabled} onChange={setEnabled} />
        <ConsolePluginWarning
          previouslyEnabled={previouslyEnabled}
          enabled={enabled}
          trusted={subscription?.spec?.source === 'redhat-operators'}
        />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Save')}
        cancel={cancel}
      />
    </form>
  );
});

export const consolePluginModal = createModalLauncher(ConsolePluginModal);

export type ConsolePluginModalProps = {
  consoleOperator: K8sResourceKind;
  plugin: string;
  subscription: SubscriptionKind;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
} & HandlePromiseProps;
