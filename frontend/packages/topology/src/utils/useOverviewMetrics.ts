import { useSelector } from 'react-redux';
import type { RootState } from '@console/internal/redux';

export const useOverviewMetrics = () => {
  return useSelector((state: RootState) => state.UI.getIn(['overview', 'metrics']));
};
