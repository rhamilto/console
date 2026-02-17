import type { FC } from 'react';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import type { PluginCSPViolations } from '@console/internal/actions/ui';
import type { RootState } from '@console/internal/redux';
import { ConsolePluginCSPStatus } from './ConsoleOperatorConfig';

const ConsolePluginCSPStatusDetail: FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginName = useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);
  const cspViolations = useSelector<RootState, PluginCSPViolations>(({ UI }) =>
    UI.get('pluginCSPViolations'),
  );

  return <ConsolePluginCSPStatus hasViolations={cspViolations[pluginName] ?? false} />;
};

export default ConsolePluginCSPStatusDetail;
