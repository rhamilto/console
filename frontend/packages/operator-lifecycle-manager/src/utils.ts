import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { K8sResourceKind, ObjectMetadata } from '@console/internal/module/k8s';
import { CLUSTER_SERVICE_VERSION_PLUGINS_ANNOTATION, INTERNAL_OBJECTS_ANNOTATION } from './const';
import { SubscriptionKind } from './types';

export const getClusterServiceVersionPlugins = (
  annotations: ObjectMetadata['annotations'],
): string[] => parseJSONAnnotation(annotations, CLUSTER_SERVICE_VERSION_PLUGINS_ANNOTATION) ?? [];

export const getInternalObjects = (annotations: ObjectMetadata['annotations']): string[] =>
  parseJSONAnnotation(annotations, INTERNAL_OBJECTS_ANNOTATION) ?? [];

export const getOperatorIsTrusted = (subscription: SubscriptionKind) =>
  subscription?.spec?.source === 'redhat-operators';

export const getPluginIsEnabled = (console: K8sResourceKind, plugin: string) =>
  console?.spec?.plugins?.includes(plugin);
