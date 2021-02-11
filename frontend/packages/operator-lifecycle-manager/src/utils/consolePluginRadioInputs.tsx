import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { RadioInput } from '@console/internal/components/radio';

export const ConsolePluginRadioInputs: React.FC<ConsolePluginRadioInputsProps> = ({
  autofocus = false,
  pluginStatus,
  setPluginStatus,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <RadioInput
        name="Enabled"
        onChange={(e) => {
          setPluginStatus(e.target.value);
        }}
        value="Enabled"
        checked={pluginStatus === 'Enabled'}
        title={t('olm~Enabled')}
        autoFocus={autofocus ? pluginStatus === 'Enabled' : null}
      />
      <RadioInput
        name="Disabled"
        onChange={(e) => {
          setPluginStatus(e.target.value);
        }}
        value="Disabled"
        checked={pluginStatus === 'Disabled'}
        title={t('olm~Disabled')}
        autoFocus={autofocus ? pluginStatus === 'Disabled' : null}
      />
    </>
  );
};

type ConsolePluginRadioInputsProps = {
  autofocus?: boolean;
  pluginStatus: string;
  setPluginStatus: (value: string) => void;
};
