# Bulk Selection and Actions in ConsoleDataView

This guide explains how to add bulk selection and bulk actions to an existing `ConsoleDataView` instance.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up Selection State](#step-1-set-up-selection-state)
3. [Step 2: Add Selection Column](#step-2-add-selection-column)
4. [Step 3: Pass Selection to Row Renderer](#step-3-pass-selection-to-row-renderer)
5. [Step 4: Create Bulk Actions](#step-4-create-bulk-actions)
6. [Step 5: Wire Everything Together](#step-5-wire-everything-together)
7. [Complete Example](#complete-example)
8. [Advanced Usage](#advanced-usage)

## Prerequisites

Before adding bulk selection, ensure you have:

- An existing `ConsoleDataView` component
- A unique identifier function for your data items (e.g., `getUID`)
- Understanding of your data type and which items should be selectable

## Step 1: Set Up Selection State

Use the `useDataViewSelection` hook to manage selection state:

```typescript
import { useDataViewSelection } from '@console/app/src/components/data-view/useDataViewSelection';
import { getUID } from '@console/shared/src/selectors/common';

const { selectedIds, selectedItems, onSelectItem, onSelectAll, clearSelection } = 
  useDataViewSelection({
    data,  // Your data array
    getItemId: getUID,  // Function to extract unique ID from an item
    filterSelectable: (item) => !isSpecialType(item),  // Optional: exclude certain items
  });
```

### Parameters:

- **`data`**: Array of all items in your view
- **`getItemId`**: Function that extracts a unique string ID from each item
- **`filterSelectable`** (optional): Filter function to exclude items from selection (e.g., CSRs, pending items)

### Returns:

- **`selectedIds`**: Set of selected item IDs
- **`selectedItems`**: Array of selected item objects
- **`onSelectItem`**: Callback to select/deselect a single item
- **`onSelectAll`**: Callback to select/deselect all filtered items
- **`clearSelection`**: Function to clear all selections

## Step 2: Add Selection Column

Add a selection column to your columns array using the `createSelectionColumn` helper:

```typescript
import { createSelectionColumn } from '@console/app/src/components/data-view/dataViewSelectionHelpers';

const columns = useMemo(() => {
  return [
    createSelectionColumn<YourDataType>(),  // Add this as the first column
    {
      title: t('Name'),
      id: 'name',
      sort: 'metadata.name',
      // ... other column config
    },
    // ... rest of your columns
  ];
}, [/* dependencies */]);
```

**Important**: The selection column should be the **first column** in your columns array.

## Step 3: Pass Selection to Row Renderer

Update your row rendering function to include selection cells:

```typescript
import { 
  createSelectionCell 
} from '@console/app/src/components/data-view/dataViewSelectionHelpers';

const getDataViewRows = (
  rowData: RowProps<YourDataType>[],
  tableColumns: ConsoleDataViewColumn<YourDataType>[],
  selection?: {
    selectedItems: Set<string>;
    onSelect: (itemId: string, isSelecting: boolean) => void;
  },
): ConsoleDataViewRow[] => {
  return rowData.map(({ obj }, rowIndex) => {
    const itemId = getUID(obj);
    const isSelectable = !isSpecialType(obj);  // Optional filtering
    
    const rowCells = {
      select: selection && isSelectable
        ? createSelectionCell({
            rowIndex,
            itemId,
            isSelected: selection.selectedItems.has(itemId),
            onSelect: selection.onSelect,
          })
        : undefined,
      name: {
        cell: <ResourceLink name={getName(obj)} />,
        // ... cell config
      },
      // ... other cells
    };

    return tableColumns.map(({ id }) => {
      const rowCell = rowCells[id];
      if (!rowCell) {
        return { id, cell: DASH };
      }
      // For select column, don't default to DASH - checkbox is rendered via props
      const cellContent = id === 'select' ? rowCell.cell ?? '' : rowCell.cell ?? DASH;
      return {
        id,
        props: rowCell.props,
        cell: cellContent,
      };
    });
  });
};
```

## Step 4: Create Bulk Actions

Create a custom hook to define bulk actions using PatternFly's `ResponsiveAction`:

```typescript
import { useMemo, useCallback } from 'react';
import { ResponsiveAction } from '@patternfly/react-component-groups';
import { useTranslation } from 'react-i18next';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';

type UseBulkActionsOptions = {
  selectedItems: YourDataType[];
  onComplete: () => void;  // Called after successful action
};

export const useBulkActions = ({ selectedItems, onComplete }: UseBulkActionsOptions) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress] = usePromiseHandler();

  const handleBulkDelete = useCallback(() => {
    const promises = selectedItems.map((item) => k8sDelete({
      model: YourModel,
      resource: item,
    }));

    handlePromise(
      Promise.allSettled(promises).then((results) => {
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          throw new Error(
            t('Failed to delete {{failureCount}} of {{totalCount}} items', {
              failureCount: failures.length,
              totalCount: results.length,
            }),
          );
        }
      }),
    )
      .then(() => onComplete())
      .catch(() => {
        // Errors are handled by usePromiseHandler
      });
  }, [selectedItems, handlePromise, t, onComplete]);

  return useMemo(() => {
    return [
      <ResponsiveAction
        key="delete"
        onClick={handleBulkDelete}
        isDisabled={inProgress || selectedItems.length === 0}
        data-test="bulk-delete"
        isPinned  // Shows action in both overflow and visible states
      >
        {t('Delete ({{count}})', { count: selectedItems.length })}
      </ResponsiveAction>,
      // Add more actions as needed
    ];
  }, [selectedItems.length, handleBulkDelete, inProgress, t]);
};
```

### Action Best Practices:

1. **Disable during operations**: Use `isDisabled={inProgress || selectedItems.length === 0}`
2. **Show count in label**: Include `({{count}})` to show how many items will be affected
3. **Handle failures gracefully**: Use `Promise.allSettled` to handle partial failures
4. **Clear selection on completion**: Call `onComplete()` after successful operations
5. **Use `isPinned`**: For important actions that should always be visible

## Step 5: Wire Everything Together

Pass the selection state and actions to `ConsoleDataView`:

```typescript
const YourList: FC<YourListProps> = ({ data, loaded, loadError }) => {
  // 1. Set up selection state
  const { selectedIds, selectedItems, onSelectItem, onSelectAll, clearSelection } = 
    useDataViewSelection({
      data,
      getItemId: getUID,
      filterSelectable: (item) => !isSpecialType(item),
    });

  // 2. Track filtered selected items (optional, for additional actions)
  const [filteredSelectedItems, setFilteredSelectedItems] = useState<YourDataType[]>([]);

  const handleFilteredSelectionChange = useCallback((items: YourDataType[]) => {
    const filtered = items.filter((item) => !isSpecialType(item));
    setFilteredSelectedItems(filtered);
  }, []);

  // 3. Create bulk actions
  const bulkActions = useBulkActions({
    selectedItems: filteredSelectedItems,
    onComplete: clearSelection,
  });

  return (
    <ConsoleDataView<YourDataType, YourFilters>
      data={data}
      loaded={loaded}
      loadError={loadError}
      columns={columns}
      getDataViewRows={(rowData, tableColumns) =>
        getYourDataViewRows(
          rowData,
          tableColumns,
          {
            selectedItems: selectedIds,
            onSelect: onSelectItem,
          },
        )
      }
      additionalActions={bulkActions}
      selection={{
        selectedItems: selectedIds,
        onSelect: onSelectItem,
        onSelectAll,
        getItemId: getUID,
        onFilteredSelectionChange: handleFilteredSelectionChange,
      }}
      // ... other props
    />
  );
};
```

## Complete Example

Here's a complete example based on the Nodes page implementation:

```typescript
import { FC, useMemo, useCallback, useState } from 'react';
import { ResponsiveAction } from '@patternfly/react-component-groups';
import { useTranslation } from 'react-i18next';
import {
  ConsoleDataView,
  createSelectionColumn,
  createSelectionCell,
} from '@console/app/src/components/data-view';
import { useDataViewSelection } from '@console/app/src/components/data-view/useDataViewSelection';
import { getUID } from '@console/shared/src/selectors/common';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';

type MyItem = {
  metadata: {
    name: string;
    uid: string;
  };
  spec?: {
    special?: boolean;
  };
};

// Custom hook for bulk actions
const useBulkActions = ({ selectedItems, onComplete }) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress] = usePromiseHandler();

  const handleBulkAction = useCallback(() => {
    const promises = selectedItems.map((item) => 
      // Your API call here
      doSomethingWith(item)
    );

    handlePromise(
      Promise.allSettled(promises).then((results) => {
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          throw new Error(
            t('Failed to process {{failureCount}} of {{totalCount}} items', {
              failureCount: failures.length,
              totalCount: results.length,
            }),
          );
        }
      }),
    )
      .then(() => onComplete())
      .catch(() => {});
  }, [selectedItems, handlePromise, t, onComplete]);

  return useMemo(() => {
    return [
      <ResponsiveAction
        key="bulk-action"
        onClick={handleBulkAction}
        isDisabled={inProgress || selectedItems.length === 0}
        data-test="bulk-action"
        isPinned
      >
        {t('Process ({{count}})', { count: selectedItems.length })}
      </ResponsiveAction>,
    ];
  }, [selectedItems.length, handleBulkAction, inProgress, t]);
};

const MyList: FC<{ data: MyItem[]; loaded: boolean; loadError?: unknown }> = ({
  data,
  loaded,
  loadError,
}) => {
  const { t } = useTranslation();

  // Selection state
  const { selectedIds, selectedItems, onSelectItem, onSelectAll, clearSelection } = 
    useDataViewSelection({
      data,
      getItemId: getUID,
      filterSelectable: (item) => !item.spec?.special,
    });

  // Track filtered selected items
  const [filteredSelectedItems, setFilteredSelectedItems] = useState<MyItem[]>([]);

  const handleFilteredSelectionChange = useCallback((items: MyItem[]) => {
    const filtered = items.filter((item) => !item.spec?.special);
    setFilteredSelectedItems(filtered);
  }, []);

  // Bulk actions
  const bulkActions = useBulkActions({
    selectedItems: filteredSelectedItems,
    onComplete: clearSelection,
  });

  // Columns with selection
  const columns = useMemo(() => {
    return [
      createSelectionColumn<MyItem>(),
      {
        title: t('Name'),
        id: 'name',
        sort: 'metadata.name',
      },
      // ... more columns
    ];
  }, [t]);

  // Row renderer
  const getDataViewRows = useCallback(
    (rowData, tableColumns) => {
      return rowData.map(({ obj }, rowIndex) => {
        const itemId = getUID(obj);
        const isSelectable = !obj.spec?.special;

        const rowCells = {
          select: isSelectable
            ? createSelectionCell({
                rowIndex,
                itemId,
                isSelected: selectedIds.has(itemId),
                onSelect: onSelectItem,
              })
            : undefined,
          name: {
            cell: obj.metadata.name,
          },
        };

        return tableColumns.map(({ id }) => {
          const rowCell = rowCells[id];
          if (!rowCell) {
            return { id, cell: '-' };
          }
          const cellContent = id === 'select' ? rowCell.cell ?? '' : rowCell.cell ?? '-';
          return {
            id,
            props: rowCell.props,
            cell: cellContent,
          };
        });
      });
    },
    [selectedIds, onSelectItem],
  );

  return (
    <ConsoleDataView
      data={data}
      loaded={loaded}
      loadError={loadError}
      columns={columns}
      getDataViewRows={getDataViewRows}
      additionalActions={bulkActions}
      selection={{
        selectedItems: selectedIds,
        onSelect: onSelectItem,
        onSelectAll,
        getItemId: getUID,
        onFilteredSelectionChange: handleFilteredSelectionChange,
      }}
    />
  );
};
```

## additionalActions vs customActions

ConsoleDataView supports two different props for providing actions to the toolbar:

### `additionalActions` (Recommended for Bulk Selection)

Use `additionalActions` when you want to provide actions that appear **in addition to** the default actions provided by the DataView. This is the recommended approach for bulk selection actions.

```typescript
const bulkActions = useBulkActions({
  selectedItems: filteredSelectedItems,
  onComplete: clearSelection,
});

<ConsoleDataView
  // ... other props
  additionalActions={bulkActions}
  selection={{
    selectedItems: selectedIds,
    onSelect: onSelectItem,
    onSelectAll,
    getItemId: getUID,
    onFilteredSelectionChange: handleFilteredSelectionChange,
  }}
/>
```

**When to use:**

- You want bulk selection actions to appear alongside default DataView actions
- You're adding functionality without removing existing behavior
- Most common use case for bulk selection

### `customActions` (Advanced Use Cases)

Use `customActions` when you want to **completely replace** the default actions with your own custom implementation. This gives you full control over the actions toolbar but requires you to manage all actions yourself.

```typescript
const customActions = useCustomActions({
  selectedItems: filteredSelectedItems,
  onComplete: clearSelection,
});

<ConsoleDataView
  // ... other props
  customActions={customActions}
  selection={{
    selectedItems: selectedIds,
    onSelect: onSelectItem,
    onSelectAll,
    getItemId: getUID,
    onFilteredSelectionChange: handleFilteredSelectionChange,
  }}
/>
```

**When to use:**

- You need complete control over all toolbar actions
- You're extending the actions via the Dynamic Plugin SDK
- You want to hide or replace default DataView actions entirely

#### Example: Extending via Dynamic Plugin SDK

The Nodes page uses `customActions` to allow dynamic plugins to contribute custom node actions:

```typescript
// In your component
const customActions = useCustomNodeActions({
  selectedNodes: filteredSelectedNodes,
  onComplete: clearSelection,
});

<ConsoleDataView
  customActions={customActions}
  // ... other props
/>

// In useCustomNodeActions.tsx
export const useCustomNodeActions = ({ selectedNodes, onComplete }) => {
  const { t } = useTranslation();
  
  // Get actions from dynamic plugins via SDK
  const [actionProviders] = useResolvedExtensions<ActionProvider<NodeKind>>(
    isActionProvider,
  );
  
  // Built-in actions
  const builtInActions = useNodeActions({ selectedNodes, onComplete });
  
  // Custom actions from plugins
  const customActions = useMemo(() => {
    return actionProviders.flatMap((provider) => 
      provider.properties.provider({ selectedNodes, onComplete })
    );
  }, [actionProviders, selectedNodes, onComplete]);
  
  // Combine built-in and custom actions
  return useMemo(() => {
    return [...builtInActions, ...customActions];
  }, [builtInActions, customActions]);
};
```

#### Key Differences

| Feature | `additionalActions` | `customActions` |
| ------- | ------------------- | --------------- |
| **Default actions** | Preserved | Replaced |
| **Use case** | Add bulk selection actions | Full control or plugin extension |
| **Complexity** | Simple | Advanced |
| **Plugin SDK** | Not extensible | Can be extended via SDK |

## Advanced Usage

### Filtering Selectable Items

Some items may not be eligible for selection (e.g., pending resources, special types):

```typescript
const { selectedIds, onSelectItem, onSelectAll } = useDataViewSelection({
  data,
  getItemId: getUID,
  filterSelectable: (item) => {
    // Exclude Certificate Signing Requests
    if (isCSRResource(item)) return false;
    
    // Exclude items in pending state
    if (item.status?.phase === 'Pending') return false;
    
    return true;
  },
});
```

### Conditional Actions Based on Selection

Actions can be dynamically enabled/disabled based on the selected items:

```typescript
const { schedulableCount, unschedulableCount } = useMemo(() => {
  let schedulable = 0;
  let unschedulable = 0;
  selectedNodes.forEach((node) => {
    if (isNodeUnschedulable(node)) {
      unschedulable++;
    } else {
      schedulable++;
    }
  });
  return { schedulableCount: schedulable, unschedulableCount: unschedulable };
}, [selectedNodes]);

return [
  <ResponsiveAction
    key="mark-schedulable"
    onClick={handleMarkSchedulable}
    isDisabled={inProgress || unschedulableCount === 0}
    isPinned
  >
    {t('Mark as schedulable ({{nodeCount}})', { nodeCount: unschedulableCount })}
  </ResponsiveAction>,
  <ResponsiveAction
    key="mark-unschedulable"
    onClick={handleMarkUnschedulable}
    isDisabled={inProgress || schedulableCount === 0}
    isPinned
  >
    {t('Mark as unschedulable ({{nodeCount}})', { nodeCount: schedulableCount })}
  </ResponsiveAction>,
];
```

### Handling Filtered Selection Changes

The `onFilteredSelectionChange` callback is called when the filtered data changes (e.g., after applying filters). This is useful for updating custom actions to only operate on visible, filtered items:

```typescript
const handleFilteredSelectionChange = useCallback((items: YourDataType[]) => {
  // Filter out non-selectable items
  const selectableItems = items.filter((item) => !isSpecialType(item));
  setFilteredSelectedItems(selectableItems);
}, []);
```

### Automatically Clearing Invalid Selections

The `useDataViewSelection` hook automatically removes selections for items that no longer exist in the data:

```typescript
// If data changes and a selected item is removed, it will be automatically
// deselected. No manual cleanup needed!
```

## Related Documentation

- [ConsoleDataView](./ConsoleDataView.tsx) - Main data view component
- [dataViewSelectionHelpers.ts](./dataViewSelectionHelpers.ts) - Selection helper functions
- [useDataViewSelection.ts](./useDataViewSelection.ts) - Selection state management hook

## Real-World Examples

For complete working examples, see:

- [NodesPage.tsx](../nodes/NodesPage.tsx) - Full implementation with bulk selection and schedulable actions
- [useNodeActions.tsx](../nodes/useNodeActions.tsx) - Example of bulk action hooks
