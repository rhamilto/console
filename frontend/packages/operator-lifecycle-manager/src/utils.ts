import * as _ from 'lodash';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { K8sResourceKind, ObjectMetadata, Patch } from '@console/internal/module/k8s';
import { CLUSTER_SERVICE_VERSION_PLUGINS_ANNOTATION, INTERNAL_OBJECTS_ANNOTATION } from './const';

export const getClusterServiceVersionPlugins = (
  annotations: ObjectMetadata['annotations'],
): string[] => parseJSONAnnotation(annotations, CLUSTER_SERVICE_VERSION_PLUGINS_ANNOTATION) ?? [];

export const getInternalObjects = (annotations: ObjectMetadata['annotations']): string[] =>
  parseJSONAnnotation(annotations, INTERNAL_OBJECTS_ANNOTATION) ?? [];

export const getPluginIsEnabled = (console: K8sResourceKind, plugin: string): boolean =>
  !!console?.spec?.plugins?.includes(plugin);

export const getPluginPatch = (
  console: K8sResourceKind,
  plugin: string,
  enabled: boolean,
): Patch => {
  if (!enabled) {
    return {
      path: '/spec/plugins',
      value: console.spec.plugins.filter((p: string) => p !== plugin),
      op: 'replace',
    };
  }

  // Create the array if it doesn't exist. Append to the array otherwise.
  return _.isEmpty(console.spec.plugins)
    ? {
        path: '/spec/plugins',
        value: [plugin],
        op: 'add',
      }
    : {
        path: '/spec/plugins/-',
        value: plugin,
        op: 'add',
      };
};
