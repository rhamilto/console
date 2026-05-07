# Indeterminate Checkbox Implementation

This directory contains a workaround to add indeterminate checkbox support to PatternFly DataView tables until native support is added.

## Problem

PatternFly v6's Table component does not support indeterminate state for the select-all checkbox in the header. The `ThSelectType` interface only supports `isSelected: boolean`, which means:
- When **all** items are selected → checkbox is checked ✓
- When **some** items are selected → checkbox is unchecked (looks like none selected)
- When **no** items are selected → checkbox is unchecked

This creates poor UX because users can't tell if some items are selected vs none selected.

## Solution

We've implemented a hook-based workaround that sets the indeterminate state via DOM manipulation after PatternFly renders the checkbox.

### Files Modified

1. **`useIndeterminateCheckbox.ts`** - New hook that finds and updates the checkbox DOM element
2. **`ConsoleDataView.tsx`** - Calculates indeterminate state and uses the hook
3. **`useConsoleDataViewData.tsx`** - Handles select-all logic for visible items

### How It Works

1. **Selection state calculation** (`ConsoleDataView.tsx`):

   ```typescript
   const visibleSelectedCount = visibleItems.filter((item) =>
     selection.selectedItems.has(selection.getItemId(item)),
   ).length;
   const isIndeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleCount;
   ```

2. **Hook invocation** (`ConsoleDataView.tsx`):

   ```typescript
   useIndeterminateCheckbox(bannerState.isIndeterminate);
   ```

3. **DOM manipulation** (`useIndeterminateCheckbox.ts`):

   ```typescript
   const checkbox = document.querySelector('th.pf-v6-c-table__check input[name="check-all"]');
   if (checkbox) {
     checkbox.indeterminate = isIndeterminate;
   }
   ```

### Behavior

The checkbox state is based on the **current page/visible items** only:

- **Unchecked** (`isSelected: false`) - No visible items selected
  - **Clicking**: Selects all visible items on current page
- **Indeterminate** (`isSelected: null`) - Some (but not all) visible items on current page selected
  - **Clicking**: Selects all remaining visible items on current page (completes page selection)
- **Checked** (`isSelected: true`) - All visible items on current page selected
  - **Clicking**: Deselects all visible items on current page

### Selection Logic

1. **Checkbox states** are determined by visible items only (not all filtered items):
   - **Checked** (`true`): All items on the current page are selected
   - **Indeterminate** (`null`): Some (but not all) items on the current page are selected
   - **Unchecked** (`false`): No items on the current page are selected

2. **Click behavior**:
   - Unchecked → Click → Select all visible items (on current page)
   - Indeterminate → Click → Select all visible items (completes the page selection)
   - Checked → Click → Deselect all visible items (on current page)

3. **Banner behavior** (separate from checkbox):
   - When all visible items are selected AND there are more pages, a banner appears
   - The banner shows two states:
     - "All X items on this page are selected. [Select all Y matching items]"
     - "All X matching items are selected. [Unselect all]"

## Testing

To test the indeterminate state:

1. Navigate to Compute → Nodes (or any page with a selectable DataView table)
2. Select **no items** → header checkbox should be unchecked
3. Select **some items** (not all visible) → header checkbox should show dash/minus (indeterminate)
4. Select **all visible items** → header checkbox should be checked
5. With all visible items selected and multiple pages, verify banner appears
6. Click "Select all X matching items" in banner → all items across all pages selected
7. Verify banner changes to "All X matching items are selected. [Unselect all]"

## Notes

- Uses PatternFly's native `isSelected: boolean | null` support (not DOM manipulation)
- The indeterminate state is scoped to visible items on the current page only
- Selection state is recalculated in `dataViewColumnsWithSortApplied` to use visible items
