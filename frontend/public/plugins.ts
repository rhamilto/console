import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { getSharedScope } from '@console/dynamic-plugin-sdk/src/runtime/plugin-shared-modules';
import type { LocalPluginManifest } from '@openshift/dynamic-plugin-sdk';
import type { Middleware } from 'redux';
import { dynamicPluginNames } from '@console/plugin-sdk/src/utils/allowed-plugins';
import type { RootState } from './redux';
import { valid as semver } from 'semver';
import { consoleFetch } from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';
import { ValidationResult } from '@console/dynamic-plugin-sdk/src/validation/ValidationResult';
import { REMOTE_ENTRY_CALLBACK } from '@console/dynamic-plugin-sdk/src/constants';

/**
 * Set by `console-operator` or `./bin/bridge -release-version`. If this is
 * undefined, we will not check this value when loading plugins.
 */
const CURRENT_OPENSHIFT_VERSION = semver(window.SERVER_FLAGS.releaseVersion) ?? undefined;

/**
 * Console local plugins module has its source generated during webpack build,
 * so we use dynamic require() instead of the usual static import statement.
 */
const localPlugins: LocalPluginManifest[] =
  process.env.NODE_ENV !== 'test' ? require('../get-local-plugins').default : [];

const localPluginNames = localPlugins.map((p) => p.name);

/**
 * Provides access to Console plugins and their extensions.
 *
 * Plugins listed via {@link dynamicPluginNames} are loaded dynamically at runtime.
 *
 * In development, this object is exposed as `window.pluginStore` for easier debugging.
 */
export const pluginStore = new PluginStore({
  loaderOptions: {
    sharedScope: getSharedScope(),
    fetchImpl: consoleFetch,
    canLoadPlugin: (manifest) => {
      return localPluginNames.includes(manifest.name) || dynamicPluginNames.includes(manifest.name);
    },
    // Allows plugins to target a specific version of OpenShift via semver
    customDependencyResolutions: {
      '@console/pluginAPI': CURRENT_OPENSHIFT_VERSION,
    },
    // Additional validation for Console plugin manifests
    transformPluginManifest: (manifest) => {
      // Local plugins can skip remote plugin validation
      if (localPluginNames.includes(manifest.name)) {
        return manifest;
      }

      // Ensure plugin name can be a valid DNS subdomain name for loading
      const result = new ValidationResult('Console plugin metadata');
      result.assertions.validDNSSubdomainName(manifest.name, 'metadata.name');
      result.report();

      // No issues, return manifest as-is
      return manifest;
    },
    // Explicitly define the default entry callback name
    entryCallbackSettings: {
      name: REMOTE_ENTRY_CALLBACK,
      registerCallback: true,
    },
  },
});

localPlugins.forEach((plugin) => pluginStore.loadPlugin(plugin));

/**
 * Redux middleware to update plugin store feature flags when actions are dispatched.
 */
export const featureFlagMiddleware: Middleware<{}, RootState> = (s) => {
  let prevFlags: RootState['FLAGS'] | undefined;

  return (next) => (action) => {
    const result = next(action);
    const nextFlags = s.getState().FLAGS;

    if (nextFlags !== prevFlags) {
      prevFlags = nextFlags;
      pluginStore.setFeatureFlags(nextFlags.toObject());
    }

    return result;
  };
};

if (process.env.NODE_ENV !== 'production') {
  // Expose Console plugin store for debugging
  window.pluginStore = pluginStore;
}

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Static plugins: [${localPluginNames.join(', ')}]`);
  // eslint-disable-next-line no-console
  console.info(`Dynamic plugins: [${dynamicPluginNames.join(', ')}]`);
}
