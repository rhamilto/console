import { useSelector } from 'react-redux';
import type { RootState } from '@console/internal/redux';

export const useLocation = (): string =>
  useSelector(({ UI }: RootState) => UI.get('location') ?? '');
