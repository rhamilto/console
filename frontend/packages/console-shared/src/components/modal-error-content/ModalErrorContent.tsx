import type { FC, ReactNode } from 'react';
import { HelperText, HelperTextItem } from '@patternfly/react-core';

export interface ModalErrorContentProps {
  /** The error message to display */
  errorMessage?: ReactNode;
  /** Optional additional CSS class names */
  className?: string;
  /** Optional data-test attribute for testing */
  'data-test'?: string;
}

/**
 * Displays an error message in a modal footer using PatternFly HelperText.
 *
 * @example
 * ```tsx
 * <ModalFooter>
 *   <ModalErrorContent errorMessage={errorMessage} />
 *   {/* modal footer buttons *\/}
 * </ModalFooter>
 * ```
 */
export const ModalErrorContent: FC<ModalErrorContentProps> = ({
  errorMessage,
  className = 'pf-v6-u-w-100 pf-v6-u-mb-md',
  'data-test': dataTest = 'modal-error',
}) => {
  if (!errorMessage) {
    return null;
  }

  return (
    <HelperText isLiveRegion className={className}>
      <HelperTextItem variant="error" data-test={dataTest}>
        {errorMessage}
      </HelperTextItem>
    </HelperText>
  );
};
