import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';

import { SubscriptionKind } from '../types';
import { getOperatorIsTrusted } from '../utils';

export const ConsolePluginWarning: React.FC<ConsolePluginWarningProps> = ({
  pluginIsEnabled,
  pluginStatus,
  subscription,
}) => {
  const { t } = useTranslation();
  return (
    !pluginIsEnabled &&
    pluginStatus === 'Enabled' &&
    !getOperatorIsTrusted(subscription) && (
      <Alert variant="warning" isInline title={t('olm~Enabling console UI extension')}>
        <p>
          {t(
            'olm~This operator will be able to provide a custom interface and run any kubernetes command as the logged in user.  Make sure you trust it before enabling.',
          )}
        </p>
      </Alert>
    )
  );
};

type ConsolePluginWarningProps = {
  pluginIsEnabled: boolean;
  pluginStatus: string;
  subscription: SubscriptionKind;
};
