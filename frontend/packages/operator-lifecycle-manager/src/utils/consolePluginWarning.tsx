import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';

export const ConsolePluginWarning: React.FC<ConsolePluginWarningProps> = ({
  trusted,
  previouslyEnabled,
  enabled,
}) => {
  const { t } = useTranslation();
  return (
    !previouslyEnabled &&
    enabled &&
    !trusted && (
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
  trusted: boolean;
  previouslyEnabled: boolean;
  enabled: boolean;
};
