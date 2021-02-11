import * as React from 'react';

import { ConsolePluginWarning } from './consolePluginWarning';
import { ConsolePluginRadioInputs } from './consolePluginRadioInputs';

export const ConsolePluginForm: React.FC<ConsolePluginFormProps> = ({
  csvPluginsCount,
  operatorIsTrusted,
  plugin,
}) => {
  return (
    <fieldset key={plugin}>
      <div>
        {csvPluginsCount > 1 && <legend className="co-legend co-legend--nested">{plugin}</legend>}
        <ConsolePluginRadioInputs pluginStatus="Enabled" setPluginStatus={} />
        <ConsolePluginWarning
          operatorIsTrusted={operatorIsTrusted}
          /* TODO:  check console operator for plugin */
          pluginIsEnabled={false}
          /* TODO: get value from state */
          pluginStatus="Enabled"
        />
      </div>
    </fieldset>
  );
};

type ConsolePluginFormProps = {
  csvPluginsCount: number;
  operatorIsTrusted: boolean;
  plugin: string;
};
