import * as _ from 'lodash';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { K8sResourceKind, ObjectMetadata, Patch } from '@console/internal/module/k8s';
import { CLUSTER_SERVICE_VERSION_PLUGINS_ANNOTATION, INTERNAL_OBJECTS_ANNOTATION } from './const';

export const getClusterServiceVersionPlugins = (
  annotations: ObjectMetadata['annotations'],
): string[] => parseJSONAnnotation(annotations, CLUSTER_SERVICE_VERSION_PLUGINS_ANNOTATION) ?? [];

export const getInternalObjects = (annotations: ObjectMetadata['annotations']): string[] =>
  parseJSONAnnotation(annotations, INTERNAL_OBJECTS_ANNOTATION) ?? [];

export const getPluginIsEnabled = (console: K8sResourceKind, plugin: string) =>
  console?.spec?.plugins?.includes(plugin);

export const getPluginPatch = (
  console: K8sResourceKind,
  plugin: string,
  pluginStatus: string,
): Patch => {
  // Create the array if it doesn't exist. Append to the array otherwise.
  const patch: Patch = _.isEmpty(console.spec.plugins)
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
  if (pluginStatus === 'Disabled') {
    patch.path = '/spec/plugins';
    patch.value = console.spec.plugins.filter((p) => p !== plugin);
    patch.op = 'replace';
  }

  return patch;
};
