import { useEffect } from 'react';

/**
 * Hook to set indeterminate state on select-all checkbox in DataView table.
 * This is a workaround until PatternFly adds native support for indeterminate state.
 * See: https://github.com/patternfly/patternfly-react/issues/12404
 *
 * When the checkbox is clicked while in indeterminate state, it should:
 * 1. Clear the indeterminate state
 * 2. Become checked (selecting all visible items)
 *
 * This happens automatically because:
 * - When indeterminate, isSelected prop is false
 * - Clicking passes isSelecting=true to the handler
 * - Handler selects all visible items
 * - On next render, all visible items are selected so isSelected becomes true
 *
 * @param isIndeterminate - Whether the checkbox should be in indeterminate state
 */
export const useIndeterminateCheckbox = (isIndeterminate: boolean) => {
  useEffect(() => {
    // Find the select-all checkbox in the table header
    // PatternFly DataView uses: th.pf-v6-c-table__check input[type="checkbox"][name="check-all"]
    const checkbox = document.querySelector<HTMLInputElement>(
      'th.pf-v6-c-table__check input[type="checkbox"][name="check-all"]',
    );

    if (checkbox) {
      // Set indeterminate state via DOM property
      // Note: indeterminate doesn't change the checked state, it's a separate visual state
      // When clicked, the checkbox will toggle based on the checked property
      checkbox.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);
};
