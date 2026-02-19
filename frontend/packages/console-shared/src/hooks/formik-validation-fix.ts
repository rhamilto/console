import { useRef, useEffect } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useDeepCompareMemoize } from './deep-compare-memoize';

export const useFormikValidationFix = (value: any) => {
  const { validateForm } = useFormikContext<FormikValues>();
  const memoizedValue = useDeepCompareMemoize(value);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      // skip auto validation when the component just mounted
      mounted.current = true;
    } else {
      validateForm();
    }
  }, [memoizedValue, validateForm]);
};
