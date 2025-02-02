// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useSelector } from 'react-redux';
import { FeatureSubStore } from '../app/features';

export type UseFlag = (flag: string) => boolean;

/**
 * Hook that returns the given feature flag from FLAGS redux state.
 * @param flag The feature flag to return
 * @returns the boolean value of the requested feature flag or undefined
 */
export const useFlag: UseFlag = (flag) =>
  useSelector<FeatureSubStore, boolean>(({ FLAGS }) => FLAGS.get(flag));
