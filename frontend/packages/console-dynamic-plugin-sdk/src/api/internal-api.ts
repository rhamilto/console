/* eslint-disable */
import * as React from 'react';
import {
  ActivityItemProps,
  ActivityBodyProps,
  RecentEventsBodyProps,
  OngoingActivityBodyProps,
  AlertsBodyProps,
  AlertItemProps,
  HealthItemProps,
  ResourceInventoryItemProps,
  UtilizationItemProps,
  UtilizationBodyProps,
  UtilizationDurationDropdownProps,
  UseUtilizationDuration,
  VirtualizedGridProps,
  LazyActionMenuProps,
  UseDashboardResources,
  QuickStartsLoaderProps,
  UseURLPoll,
  UseLastNamespace,
} from './internal-types';
import { UseUserSettings } from '../extensions/console-types';

export * from './internal-topology-api';

export const ActivityItem: React.FC<ActivityItemProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityItem')
  .default;
export const ActivityBody: React.FC<ActivityBodyProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .default;
export const RecentEventsBody: React.FC<RecentEventsBodyProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .RecentEventsBody;
export const OngoingActivityBody: React.FC<OngoingActivityBodyProps> = require('@console/shared/src/components/dashboard/activity-card/ActivityBody')
  .OngoingActivityBody;
export const AlertsBody: React.FC<AlertsBodyProps> = require('@console/shared/src/components/dashboard/status-card/AlertsBody')
  .default;
export const AlertItem: React.FC<AlertItemProps> = require('@console/shared/src/components/dashboard/status-card/AlertItem')
  .default;
export const HealthItem: React.FC<HealthItemProps> = require('@console/shared/src/components/dashboard/status-card/HealthItem')
  .default;
export const HealthBody: React.FC = require('@console/shared/src/components/dashboard/status-card/HealthBody')
  .default;
export const ResourceInventoryItem: React.FC<ResourceInventoryItemProps> = require('@console/shared/src/components/dashboard/inventory-card/InventoryItem')
  .ResourceInventoryItem;
export const UtilizationItem: React.FC<UtilizationItemProps> = require('@console/shared/src/components/dashboard/utilization-card/UtilizationItem')
  .default;
export const UtilizationBody: React.FC<UtilizationBodyProps> = require('@console/shared/src/components/dashboard/utilization-card/UtilizationBody')
  .default;
export const UtilizationDurationDropdown: React.FC<UtilizationDurationDropdownProps> = require('@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown')
  .UtilizationDurationDropdown;
export const VirtualizedGrid: React.FC<VirtualizedGridProps> = require('@console/shared/src/components/virtualized-grid/VirtualizedGrid')
  .default;
export const LazyActionMenu: React.FC<LazyActionMenuProps> = require('@console/shared/src/components/actions/LazyActionMenu')
  .default;
export const QuickStartsLoader: React.FC<QuickStartsLoaderProps> = require('@console/app/src/components/quick-starts/loader/QuickStartsLoader')
  .default;

export const useUtilizationDuration: UseUtilizationDuration = require('@console/shared/src/hooks/useUtilizationDuration')
  .useUtilizationDuration;
export const useDashboardResources: UseDashboardResources = require('@console/shared/src/hooks/useDashboardResources')
  .useDashboardResources;
// useUserSettings is deprecated and is now exposed in dynamic plugin SDK.
export const useUserSettings: UseUserSettings = require('@console/shared/src/hooks/useUserSettings')
  .useUserSettings;
export const useURLPoll: UseURLPoll = require('@console/internal/components/utils/url-poll-hook')
  .useURLPoll;
export const useLastNamespace: UseLastNamespace = require('@console/app/src/components/detect-namespace/useLastNamespace')
  .useLastNamespace;
