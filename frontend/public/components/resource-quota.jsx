import * as _ from 'lodash-es';
import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { Table as PfTable, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { OutlinedCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-circle-icon';
import { ResourcesAlmostEmptyIcon } from '@patternfly/react-icons/dist/esm/icons/resources-almost-empty-icon';
import { ResourcesAlmostFullIcon } from '@patternfly/react-icons/dist/esm/icons/resources-almost-full-icon';
import { ResourcesFullIcon } from '@patternfly/react-icons/dist/esm/icons/resources-full-icon';
import { UnknownIcon } from '@patternfly/react-icons/dist/esm/icons/unknown-icon';

import { useTranslation } from 'react-i18next';
import AppliedClusterResourceQuotaCharts from '@console/app/src/components/resource-quota/AppliedClusterResourceQuotaCharts';
import ResourceQuotaCharts from '@console/app/src/components/resource-quota/ResourceQuotaCharts';
import ClusterResourceQuotaCharts from '@console/app/src/components/resource-quota/ClusterResourceQuotaCharts';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

import { FLAGS, YellowExclamationTriangleIcon, DASH } from '@console/shared';
import { DetailsPage, MultiListPage } from './factory';
import {
  Kebab,
  SectionHeading,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  convertToBaseValue,
  FieldLevelHelp,
  useAccessReview,
  LabelList,
  Selector,
  DetailsItem,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { connectToFlags } from '../reducers/connectToFlags';
import { flagPending } from '../reducers/features';
import { LoadingBox } from './utils/status-box';
import { referenceFor, referenceForModel } from '../module/k8s';
import {
  AppliedClusterResourceQuotaModel,
  ResourceQuotaModel,
  ClusterResourceQuotaModel,
} from '../models';
import { getUsedPercentage } from '@console/app/src/components/resource-quota/utils';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ResourceDataView,
} from '@console/app/src/components/data-view/ResourceDataView';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';

const { common } = Kebab.factory;

const resourceQuotaMenuActions = [
  ...Kebab.getExtensionsActionsForKind(ResourceQuotaModel),
  ...common,
];
const clusterResourceQuotaMenuActions = [
  ...Kebab.getExtensionsActionsForKind(ClusterResourceQuotaModel),
  ...common,
];
const appliedClusterResourceQuotaMenuActions = (namespace) => [
  ...Kebab.getExtensionsActionsForKind(ClusterResourceQuotaModel),
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  (kind, obj) => {
    return {
      // t('public~Edit AppliedClusterResourceQuota')
      labelKey: 'public~Edit AppliedClusterResourceQuota',
      href: `/k8s/ns/${namespace}/${referenceForModel(AppliedClusterResourceQuotaModel)}/${
        obj.metadata.name
      }/yaml`,
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        name: obj.metadata.name,
        namespace,
        verb: 'update',
      },
    };
  },
  Kebab.factory.Delete,
];

const isClusterQuota = (quota) => !quota.metadata.namespace;

const clusterQuotaReference = referenceForModel(ClusterResourceQuotaModel);
const appliedClusterQuotaReference = referenceForModel(AppliedClusterResourceQuotaModel);

const quotaActions = (quota, customData = undefined) => {
  if (quota.metadata.namespace) {
    return resourceQuotaMenuActions;
  }

  if (quota.kind === 'ClusterResourceQuota') {
    return clusterResourceQuotaMenuActions;
  }

  if (quota.kind === 'AppliedClusterResourceQuota') {
    return appliedClusterResourceQuotaMenuActions(customData.namespace);
  }
};

export const getQuotaResourceTypes = (quota) => {
  const specHard = isClusterQuota(quota)
    ? _.get(quota, 'spec.quota.hard')
    : _.get(quota, 'spec.hard');
  return _.keys(specHard).sort();
};

export const getACRQResourceUsage = (quota, resourceType, namespace) => {
  let used;
  if (namespace) {
    const allNamespaceData = quota.status?.namespaces;
    const currentNamespaceData = allNamespaceData.filter((ns) => ns.namespace === namespace);
    used = {
      namespace: currentNamespaceData[0]?.status?.used[resourceType],
      cluster: quota.status?.total?.used[resourceType],
    };
  } else {
    used = { namespace: 0, cluster: quota.status?.total?.used[resourceType] };
  }
  const totalUsed = quota.status?.total?.used[resourceType];
  const max = quota.status?.total?.hard[resourceType] || quota.spec?.quota?.hard[resourceType];
  const percentNamespace =
    !max || !used.namespace
      ? 0
      : (convertToBaseValue(used.namespace) / convertToBaseValue(max)) * 100;
  const percentCluster =
    !max || !used.cluster ? 0 : (convertToBaseValue(used.cluster) / convertToBaseValue(max)) * 100;
  const percentOtherNamespaces = percentCluster - percentNamespace;

  return {
    used,
    totalUsed,
    max,
    percent: {
      namespace: percentNamespace,
      otherNamespaces: percentOtherNamespaces,
      unused: 100 - (percentNamespace + percentOtherNamespaces),
    },
  };
};

export const getResourceUsage = (quota, resourceType) => {
  const isCluster = isClusterQuota(quota);
  const statusPath = isCluster ? ['status', 'total', 'hard'] : ['status', 'hard'];
  const specPath = isCluster ? ['spec', 'quota', 'hard'] : ['spec', 'hard'];
  const usedPath = isCluster ? ['status', 'total', 'used'] : ['status', 'used'];
  const max =
    _.get(quota, [...statusPath, resourceType]) || _.get(quota, [...specPath, resourceType]);
  const used = _.get(quota, [...usedPath, resourceType]);
  const percent = !max || !used ? 0 : (convertToBaseValue(used) / convertToBaseValue(max)) * 100;

  return {
    used,
    max,
    percent,
  };
};

export const UsageIcon = ({ percent }) => {
  let usageIcon = <UnknownIcon />;
  if (percent === 0) {
    usageIcon = <OutlinedCircleIcon className="co-resource-quota-empty" />;
  } else if (percent > 0 && percent < 50) {
    usageIcon = <ResourcesAlmostEmptyIcon className="co-resource-quota-almost-empty" />;
  } else if (percent >= 50 && percent < 100) {
    usageIcon = <ResourcesAlmostFullIcon className="co-resource-quota-almost-full" />;
  } else if (percent === 100) {
    usageIcon = <ResourcesFullIcon className="co-resource-quota-full" />;
  } else if (percent > 100) {
    usageIcon = <YellowExclamationTriangleIcon className="co-resource-quota-exceeded" />;
  }
  return usageIcon;
};

export const ResourceUsageRow = ({ quota, resourceType, namespace = undefined }) => {
  const reference = referenceFor(quota);
  const isACRQ = reference === appliedClusterQuotaReference;
  if (isACRQ) {
    const { used, totalUsed, max, percent } = getACRQResourceUsage(quota, resourceType, namespace);
    return (
      <Tr>
        <Td modifier="breakWord">{resourceType}</Td>
        <Td visibility={['hidden', 'visibleOnMd']} className="co-resource-quota-icon">
          <UsageIcon percent={percent.namespace} />
        </Td>
        <Td>{used.namespace}</Td>
        <Td>{totalUsed}</Td>
        <Td>{max}</Td>
      </Tr>
    );
  }

  const { used, max, percent } = getResourceUsage(quota, resourceType);
  return (
    <Tr>
      <Td modifier="breakWord">{resourceType}</Td>
      <Td visibility={['hidden', 'visibleOnMd']} className="co-resource-quota-icon">
        <UsageIcon percent={percent} />
      </Td>
      <Td>{used}</Td>
      <Td>{max}</Td>
    </Tr>
  );
};

export const QuotaScopesInline = ({ scopes }) => {
  return <span>({scopes.join(', ')})</span>;
};

const QuotaScopesList = ({ scopes }) => {
  const { t } = useTranslation();
  const quotaScopes = {
    Terminating: {
      description: t(
        'public~Affects pods that have an active deadline. These pods usually include builds, deployers, and jobs.',
      ),
    },
    NotTerminating: {
      description: t(
        'public~Affects pods that do not have an active deadline. These pods usually include your applications.',
      ),
    },
    BestEffort: {
      description: t(
        'public~Affects pods that do not have resource limits set. These pods have a best effort quality of service.',
      ),
    },
    NotBestEffort: {
      description: t(
        'public~Affects pods that have at least one resource limit set. These pods do not have a best effort quality of service.',
      ),
    },
  };
  return scopes.map((scope) => {
    const scopeObj = _.get(quotaScopes, scope);
    return scopeObj ? (
      <DescriptionListDescription key={scope}>
        <div className="co-resource-quota-scope__label">{scope}</div>
        <div className="co-resource-quota-scope__description">{scopeObj.description}</div>
      </DescriptionListDescription>
    ) : (
      <DescriptionListDescription key={scope} className="co-resource-quota-scope__label">
        {scope}
      </DescriptionListDescription>
    );
  });
};

export const hasComputeResources = (resourceTypes) => {
  const chartResourceTypes = [
    'requests.cpu',
    'cpu',
    'limits.cpu',
    'requests.memory',
    'memory',
    'limits.memory',
  ];
  return _.intersection(resourceTypes, chartResourceTypes).length > 0;
};

const Details = ({ obj: rq }) => {
  const { t } = useTranslation();
  const params = useParams();
  const resourceTypes = getQuotaResourceTypes(rq);
  const scopes = rq.spec?.scopes ?? rq.spec?.quota?.scopes;
  const reference = referenceFor(rq);
  const isACRQ = reference === appliedClusterQuotaReference;
  const namespace = params?.ns;
  let text;
  let charts;
  switch (reference) {
    case appliedClusterQuotaReference:
      text = t('public~AppliedClusterResourceQuota details');
      charts = (
        <AppliedClusterResourceQuotaCharts appliedClusterResourceQuota={rq} namespace={namespace} />
      );
      break;
    case clusterQuotaReference:
      text = t('public~ClusterResourceQuota details');
      charts = <ClusterResourceQuotaCharts clusterResourceQuota={rq} />;
      break;
    default:
      text = t('public~ResourceQuota details');
      charts = <ResourceQuotaCharts resourceQuota={rq} />;
  }
  const canListCRQ = useAccessReview({
    group: ClusterResourceQuotaModel.apiGroup,
    resource: ClusterResourceQuotaModel.plural,
    verb: 'list',
  });

  return (
    <>
      <PaneBody>
        <SectionHeading text={text} />
        {charts}
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={rq}>
              {canListCRQ && (
                <DetailsItem
                  label={t('public~ClusterResourceQuota')}
                  obj={rq}
                  path="rq.metadata.name"
                >
                  <ResourceLink kind={clusterQuotaReference} name={rq.metadata.name} />
                </DetailsItem>
              )}
              <DetailsItem
                label={t('public~Label selector')}
                obj={rq}
                path="spec.selector.labels.matchLabels"
              >
                <LabelList
                  kind={appliedClusterQuotaReference}
                  labels={rq.spec?.selector?.labels?.matchLabels}
                />
              </DetailsItem>
              <DetailsItem
                label={t('public~Project annotations')}
                obj={rq}
                path="spec.selector.annotations"
              >
                <Selector selector={rq.spec?.selector?.annotations} namespace={namespace} />
              </DetailsItem>
            </ResourceSummary>
          </GridItem>
          {scopes && (
            <GridItem sm={6}>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Scopes')}</DescriptionListTerm>
                  <QuotaScopesList scopes={scopes} />
                </DescriptionListGroup>
              </DescriptionList>
            </GridItem>
          )}
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={text} style={{ display: 'block', marginBottom: '20px' }}>
          <FieldLevelHelp>
            <p>
              {t(
                'public~Requests are the amount of resources you expect to use. These are used when establishing if the cluster can fulfill your Request.',
              )}
            </p>
            <p>
              {t(
                'public~Limits are a maximum amount of a resource you can consume. Applications consuming more than the Limit may be terminated.',
              )}
            </p>
            <p>
              {t(
                'public~A cluster administrator can establish limits on both the amount you can request and your limits with a ResourceQuota.',
              )}
            </p>
          </FieldLevelHelp>
        </SectionHeading>
        <PfTable gridBreakPoint="">
          <Thead>
            <Tr>
              <Th>{t('public~Resource type')}</Th>
              <Th visibility={['hidden', 'visibleOnMd']}>{t('public~Capacity')}</Th>
              <Th>{t('public~Used')}</Th>
              {isACRQ && <Th>{t('public~Total used')}</Th>}
              <Th>{t('public~Max')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {resourceTypes.map((type) => (
              <ResourceUsageRow key={type} quota={rq} resourceType={type} namespace={namespace} />
            ))}
          </Tbody>
        </PfTable>
      </PaneBody>
    </>
  );
};

const resourceQuotaColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'label-selector' },
  { id: 'project-annotations' },
  { id: 'status' },
  { id: 'created' },
  { id: '' },
];

const useResourceQuotaColumns = () => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: resourceQuotaColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: resourceQuotaColumnInfo[1].id,
        sort: 'spec.group',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Label selector'),
        id: resourceQuotaColumnInfo[2].id,
        sort: 'spec.selector.labels.matchLabels',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Project annotations'),
        id: resourceQuotaColumnInfo[3].id,
        sort: 'spec.selector.annotations',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: resourceQuotaColumnInfo[4].id,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: resourceQuotaColumnInfo[5].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: resourceQuotaColumnInfo[6].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const getResourceQuotaDataViewRows = (data, columns, customData) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const reference = referenceFor(obj);
    const actions = quotaActions(obj, customData);

    let resourcesAtQuota;
    if (obj.kind === ResourceQuotaModel.kind) {
      resourcesAtQuota = Object.keys(obj?.status?.hard || {}).reduce(
        (acc, resource) =>
          getUsedPercentage(obj?.status?.hard[resource], obj?.status?.used?.[resource]) >= 100
            ? acc + 1
            : acc,
        0,
      );
    } else {
      resourcesAtQuota = Object.keys(obj?.status?.total?.hard || {}).reduce(
        (acc, resource) =>
          getUsedPercentage(
            obj?.status?.total?.hard[resource],
            obj?.status?.total?.used?.[resource],
          ) >= 100
            ? acc + 1
            : acc,
        0,
      );
    }

    const rowCells = {
      [resourceQuotaColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={reference}
            name={name}
            namespace={
              reference === appliedClusterQuotaReference ? customData?.namespace : namespace
            }
            className="co-resource-item__resource-name"
            dataTest="resource-quota-link"
          />
        ),
        props: getNameCellProps(name),
      },
      [resourceQuotaColumnInfo[1].id]: {
        cell: namespace ? <ResourceLink kind="Namespace" name={namespace} /> : 'None',
      },
      [resourceQuotaColumnInfo[2].id]: {
        cell: (
          <LabelList
            kind={appliedClusterQuotaReference}
            labels={obj.spec?.selector?.labels?.matchLabels}
          />
        ),
      },
      [resourceQuotaColumnInfo[3].id]: {
        cell: (
          <Selector selector={obj.spec?.selector?.annotations} namespace={customData?.namespace} />
        ),
      },
      [resourceQuotaColumnInfo[4].id]: {
        cell:
          resourcesAtQuota > 0 ? (
            <>
              <YellowExclamationTriangleIcon />{' '}
              {`${resourcesAtQuota} resource${resourcesAtQuota > 1 ? 's' : ''} reached quota`}
            </>
          ) : (
            'none are at quota'
          ),
      },
      [resourceQuotaColumnInfo[5].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [resourceQuotaColumnInfo[6].id]: {
        cell: (
          <ResourceKebab
            customData={customData}
            actions={actions}
            kind={reference}
            resource={obj}
          />
        ),
        props: {
          ...actionsCellProps,
        },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

export const ResourceQuotasList = (props) => {
  const { t } = useTranslation();

  const roleFilterOptions = React.useMemo(
    () => [
      {
        value: 'cluster',
        label: t('public~Cluster-wide {{resource}}', {
          resource: t(ResourceQuotaModel.labelPluralKey),
        }),
      },
      {
        value: 'namespace',
        label: t('public~Namespace {{resource}}', {
          resource: t(ResourceQuotaModel.labelPluralKey),
        }),
      },
    ],
    [t],
  );

  const additionalFilterNodes = React.useMemo(
    () => [
      <DataViewCheckboxFilter
        key="role"
        filterId="role-kind"
        title={t('public~Role')}
        placeholder={t('public~Filter by role')}
        options={roleFilterOptions}
      />,
    ],
    [roleFilterOptions, t],
  );

  const matchesAdditionalFilters = (resource, filters) => {
    if (filters['role-kind'] && filters['role-kind'].length > 0) {
      const resourceType = resource?.metadata?.namespace ? 'namespace' : 'cluster';
      return filters['role-kind'].includes(resourceType);
    }
    return true;
  };

  return (
    <ResourceDataView
      {...props}
      aria-label={t('public~ResourceQuotas')}
      data={props.data}
      loaded={props.loaded}
      columns={useResourceQuotaColumns()}
      initialFilters={initialFiltersDefault}
      additionalFilterNodes={additionalFilterNodes}
      matchesAdditionalFilters={matchesAdditionalFilters}
      getDataViewRows={getResourceQuotaDataViewRows}
      customRowData={{ namespace: props.namespace }}
      hideColumnManagement={true}
    />
  );
};

const acrqTableColumnInfo = [
  { id: 'name' },
  { id: 'label-selector' },
  { id: 'project-annotations' },
  { id: 'status' },
  { id: 'created' },
  { id: '' },
];

const useAppliedClusterResourceQuotaColumns = () => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: acrqTableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Label selector'),
        id: acrqTableColumnInfo[1].id,
        sort: 'spec.selector.labels.matchLabels',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Project annotations'),
        id: acrqTableColumnInfo[2].id,
        sort: 'spec.selector.annotations',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: acrqTableColumnInfo[3].id,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: acrqTableColumnInfo[4].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: acrqTableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const getAppliedClusterResourceQuotaDataViewRows = (data, columns, customData) => {
  return data.map(({ obj }) => {
    const { name } = obj.metadata;
    const actions = quotaActions(obj, customData);
    const resourcesAtQuota = Object.keys(obj?.status?.total?.hard || {}).reduce(
      (acc, resource) =>
        getUsedPercentage(
          obj?.status?.total?.hard[resource],
          obj?.status?.total?.used?.[resource],
        ) >= 100
          ? acc + 1
          : acc,
      0,
    );

    const rowCells = {
      [acrqTableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={appliedClusterQuotaReference}
            name={name}
            namespace={customData.namespace}
            className="co-resource-item__resource-name"
          />
        ),
        props: getNameCellProps(name),
      },
      [acrqTableColumnInfo[1].id]: {
        cell: (
          <LabelList
            kind={appliedClusterQuotaReference}
            labels={obj.spec?.selector?.labels?.matchLabels}
          />
        ),
      },
      [acrqTableColumnInfo[2].id]: {
        cell: (
          <Selector selector={obj.spec?.selector?.annotations} namespace={customData.namespace} />
        ),
      },
      [acrqTableColumnInfo[3].id]: {
        cell:
          resourcesAtQuota > 0 ? (
            <>
              <YellowExclamationTriangleIcon />{' '}
              {`${resourcesAtQuota} resource${resourcesAtQuota > 1 ? 's' : ''} reached quota`}
            </>
          ) : (
            'none are at quota'
          ),
      },
      [acrqTableColumnInfo[4].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [acrqTableColumnInfo[5].id]: {
        cell: (
          <ResourceKebab
            customData={customData}
            actions={actions}
            kind={appliedClusterQuotaReference}
            resource={obj}
          />
        ),
        props: {
          ...actionsCellProps,
        },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || <span>-</span>;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

export const AppliedClusterResourceQuotasList = (props) => {
  const { t } = useTranslation();

  return (
    <ResourceDataView
      {...props}
      aria-label={t('public~AppliedClusterResourceQuotas')}
      data={props.data}
      loaded={props.loaded}
      columns={useAppliedClusterResourceQuotaColumns()}
      initialFilters={initialFiltersDefault}
      getDataViewRows={getAppliedClusterResourceQuotaDataViewRows}
      customRowData={{ namespace: props.namespace }}
      hideColumnManagement={true}
    />
  );
};

// Split each resource quota into one row per subject
export const flatten = (resources) => _.flatMap(resources, (resource) => _.compact(resource.data));

export const ResourceQuotasPage = connectToFlags(FLAGS.OPENSHIFT)(
  ({ namespace, flags, mock, showTitle, hideNameLabelFilters, hideLabelFilter }) => {
    const { t } = useTranslation();
    const resources = [{ kind: 'ResourceQuota', namespaced: true }];

    if (flagPending(flags[FLAGS.OPENSHIFT])) {
      return <LoadingBox />;
    }
    if (flags[FLAGS.OPENSHIFT]) {
      if (!namespace) {
        resources.push({
          kind: referenceForModel(ClusterResourceQuotaModel),
          namespaced: false,
          optional: true,
        });
      } else {
        resources.push({
          kind: referenceForModel(AppliedClusterResourceQuotaModel),
          namespaced: true,
          namespace,
          optional: true,
        });
      }
    }
    const createNS = namespace || 'default';
    const accessReview = {
      model: ResourceQuotaModel,
      namespace: createNS,
    };
    return (
      <MultiListPage
        canCreate={true}
        createAccessReview={accessReview}
        createButtonText={t('public~Create ResourceQuota')}
        createProps={{ to: `/k8s/ns/${createNS}/resourcequotas/~new` }}
        ListComponent={ResourceQuotasList}
        resources={resources}
        label={t(ResourceQuotaModel.labelPluralKey)}
        namespace={namespace}
        flatten={flatten}
        title={t(ResourceQuotaModel.labelPluralKey)}
        mock={mock}
        showTitle={showTitle}
        omitFilterToolbar={true}
        hideNameLabelFilters={hideNameLabelFilters}
        hideLabelFilter={hideLabelFilter}
      />
    );
  },
);

export const AppliedClusterResourceQuotasPage = ({
  namespace,
  mock,
  showTitle,
  hideNameLabelFilters,
  hideLabelFilter,
}) => {
  const { t } = useTranslation();
  const resources = [
    {
      kind: referenceForModel(AppliedClusterResourceQuotaModel),
      namespaced: true,
      namespace,
      optional: true,
    },
  ];

  return (
    <MultiListPage
      ListComponent={AppliedClusterResourceQuotasList}
      resources={resources}
      label={t(AppliedClusterResourceQuotaModel.labelPluralKey)}
      namespace={namespace}
      flatten={flatten}
      title={t(AppliedClusterResourceQuotaModel.labelPluralKey)}
      mock={mock}
      showTitle={showTitle}
      omitFilterToolbar={true}
      hideNameLabelFilters={hideNameLabelFilters}
      hideLabelFilter={hideLabelFilter}
    />
  );
};

export const ResourceQuotasDetailsPage = (props) => {
  return (
    <DetailsPage
      {...props}
      menuActions={resourceQuotaMenuActions}
      pages={[navFactory.details(Details), navFactory.editYaml()]}
    />
  );
};

export const AppliedClusterResourceQuotasDetailsPage = (props) => {
  const params = useParams();
  const actions = appliedClusterResourceQuotaMenuActions(params?.ns);
  return (
    <DetailsPage
      {...props}
      menuActions={actions}
      pages={[navFactory.details(Details), navFactory.editYaml()]}
    />
  );
};
