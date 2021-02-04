import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';

import { k8sPatch, K8sResourceKind, Patch } from '../../../../../public/module/k8s';
import { SubscriptionKind } from '../../types';
import { ConsoleModel } from '../../../../../public/models';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '../../../../../public/components/factory/modal';
import { withHandlePromise, HandlePromiseProps } from '../../../../../public/components/utils';
import { RadioInput } from '../../../../../public/components/radio';
import { getPluginIsEnabled } from '../../utils';
import { ConsolePluginWarning } from '../../utils/consolePluginWarning';

export const ConsolePluginModal = withHandlePromise((props: ConsolePluginModalProps) => {
  const {
    cancel,
    close,
    console,
    errorMessage,
    handlePromise,
    inProgress,
    plugin,
    subscription,
  } = props;
  const pluginIsEnabled = getPluginIsEnabled(console, plugin);
  const { t } = useTranslation();
  const [pluginStatus, setPluginStatus] = React.useState(pluginIsEnabled ? 'Enabled' : 'Disabled');
  const submit = (event) => {
    event.preventDefault();
    // Create the array if it doesn't exist. Append to the array otherwise.
    const patch: Patch = _.isEmpty(console.spec.plugins)
      ? {
          path: '/spec/plugins',
          value: [plugin],
          op: 'add',
        }
      : {
          path: '/spec/plugins/-',
          value: plugin,
          op: 'add',
        };
    if (pluginStatus === 'Disabled') {
      patch.path = '/spec/plugins';
      patch.value = console.spec.plugins.filter((p) => p !== plugin);
      patch.op = 'replace';
    }
    const promise = k8sPatch(ConsoleModel, console, [patch]);
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
        <RadioInput
          name="Enabled"
          onChange={(e) => {
            setPluginStatus(e.target.value);
          }}
          value="Enabled"
          checked={pluginStatus === 'Enabled'}
          title={t('olm~Enabled')}
          autoFocus={pluginStatus === 'Enabled'}
        />
        <RadioInput
          name="Disabled"
          onChange={(e) => {
            setPluginStatus(e.target.value);
          }}
          value="Disabled"
          checked={pluginStatus === 'Disabled'}
          title={t('olm~Disabled')}
          autoFocus={pluginStatus === 'Disabled'}
        />
        <ConsolePluginWarning
          pluginIsEnabled={pluginIsEnabled}
          pluginStatus={pluginStatus}
          subscription={subscription}
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
  console: K8sResourceKind;
  plugin: string;
  subscription: SubscriptionKind;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
} & HandlePromiseProps;
