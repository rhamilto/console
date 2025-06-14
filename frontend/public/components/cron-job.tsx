import * as _ from 'lodash-es';
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  getPodsForResource,
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  LazyActionMenu,
} from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  DetailsPage,
  ListPage,
  Table,
  TableData,
  RowFunctionArgs,
  ListPageWrapper,
} from './factory';
import {
  CronJobKind,
  K8sResourceCommon,
  K8sResourceKind,
  referenceForModel,
  referenceFor,
} from '../module/k8s';
import {
  ContainerTable,
  DetailsItem,
  Firehose,
  Kebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
  FirehoseResourcesResult,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceEventStream } from './events';
import { CronJobModel } from '../models';
import { PodList, getFilters as getPodFilters } from './pod';
import { JobsList } from './job';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';

const { common } = Kebab.factory;
export const menuActions = [...Kebab.getExtensionsActionsForKind(CronJobModel), ...common];

const kind = 'CronJob';

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg pf-v6-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-xl pf-v6-u-w-25-on-xl',
  Kebab.columnClass,
];

const CronJobTableRow: React.FC<RowFunctionArgs<CronJobKind>> = ({ obj: cronjob }) => {
  const resourceKind = referenceFor(cronjob);
  const context = { [resourceKind]: cronjob };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={cronjob.metadata.name}
          namespace={cronjob.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={cronjob.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{cronjob.spec.schedule}</TableData>
      <TableData className={tableColumnClasses[3]}>
        {cronjob.spec?.suspend ? i18next.t('public~True') : i18next.t('public~False')}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {_.get(cronjob.spec, 'concurrencyPolicy', '-')}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {_.get(cronjob.spec, 'startingDeadlineSeconds', '-')}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

const CronJobDetails: React.FC<CronJobDetailsProps> = ({ obj: cronjob }) => {
  const job = cronjob.spec.jobTemplate;
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <Grid hasGutter>
          <GridItem md={6}>
            <SectionHeading text={t('public~CronJob details')} />
            <ResourceSummary resource={cronjob}>
              <DetailsItem label={t('public~Schedule')} obj={cronjob} path="spec.schedule" />
              <DetailsItem label={t('public~Suspend')} obj={cronjob} path="spec.suspend">
                {cronjob.spec?.suspend ? t('public~True') : t('public~False')}
              </DetailsItem>
              <DetailsItem
                label={t('public~Concurrency policy')}
                obj={cronjob}
                path="spec.concurrencyPolicy"
              />
              <DetailsItem
                label={t('public~Starting deadline seconds')}
                obj={cronjob}
                path="spec.startingDeadlineSeconds"
              >
                {cronjob.spec.startingDeadlineSeconds
                  ? t('public~{{count}} second', { count: cronjob.spec.startingDeadlineSeconds })
                  : t('public~Not configured')}
              </DetailsItem>
              <DetailsItem
                label={t('public~Last schedule time')}
                obj={cronjob}
                path="status.lastScheduleTime"
              >
                <Timestamp timestamp={cronjob.status.lastScheduleTime} />
              </DetailsItem>
            </ResourceSummary>
          </GridItem>
          <GridItem md={6}>
            <SectionHeading text={t('public~Job details')} />
            <DescriptionList>
              <DetailsItem
                label={t('public~Desired completions')}
                obj={cronjob}
                path="spec.jobTemplate.spec.completions"
              />
              <DetailsItem
                label={t('public~Parallelism')}
                obj={cronjob}
                path="spec.jobTemplate.spec.parallelism"
              />
              <DetailsItem
                label={t('public~Active deadline seconds')}
                obj={cronjob}
                path="spec.jobTemplate.spec.activeDeadlineSeconds"
              >
                {job.spec.activeDeadlineSeconds
                  ? t('public~{{count}} second', { count: job.spec.activeDeadlineSeconds })
                  : t('public~Not configured')}
              </DetailsItem>
              <PodDisruptionBudgetField obj={cronjob} />
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={job.spec.template.spec.containers} />
      </PaneBody>
    </>
  );
};

export type CronJobPodsComponentProps = {
  obj: K8sResourceKind;
};

const getJobsWatcher = (namespace: string) => {
  return [
    {
      prop: 'jobs',
      isList: true,
      kind: 'Job',
      namespace,
    },
  ];
};

const getPodsWatcher = (namespace: string) => {
  return [
    ...getJobsWatcher(namespace),
    {
      prop: 'pods',
      isList: true,
      kind: 'Pod',
      namespace,
    },
  ];
};

export const CronJobPodsComponent: React.FC<CronJobPodsComponentProps> = ({ obj }) => {
  const { t } = useTranslation();
  const podFilters = React.useMemo(() => getPodFilters(t), [t]);
  return (
    <PaneBody>
      <Firehose resources={getPodsWatcher(obj.metadata.namespace)}>
        <ListPageWrapper
          flatten={(
            _resources: FirehoseResourcesResult<{
              jobs: K8sResourceCommon[];
              pods: K8sResourceCommon[];
            }>,
          ) => {
            if (!_resources.jobs.loaded || !_resources.pods.loaded) {
              return [];
            }
            const jobs = _resources.jobs.data.filter((job) =>
              job.metadata?.ownerReferences?.find((ref) => ref.uid === obj.metadata.uid),
            );
            return (
              jobs &&
              jobs.reduce((acc, job) => {
                acc.push(...getPodsForResource(job, _resources));
                return acc;
              }, [])
            );
          }}
          kinds={['Pods']}
          ListComponent={PodList}
          rowFilters={podFilters}
        />
      </Firehose>
    </PaneBody>
  );
};

export type CronJobJobsComponentProps = {
  obj: K8sResourceKind;
};

export const CronJobJobsComponent: React.FC<CronJobJobsComponentProps> = ({ obj }) => (
  <PaneBody>
    <Firehose resources={getJobsWatcher(obj.metadata.namespace)}>
      <ListPageWrapper
        flatten={(_resources: FirehoseResourcesResult<{ jobs: K8sResourceCommon[] }>) => {
          if (!_resources.jobs.loaded) {
            return [];
          }
          return _resources.jobs.data.filter((job) =>
            job.metadata?.ownerReferences?.find((ref) => ref.uid === obj.metadata.uid),
          );
        }}
        kinds={['Jobs']}
        ListComponent={JobsList}
      />
    </Firehose>
  </PaneBody>
);

export const CronJobsList: React.FC = (props) => {
  const { t } = useTranslation();
  const CronJobTableHeader = () => [
    {
      title: t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('public~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('public~Schedule'),
      sortField: 'spec.schedule',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('public~Suspend'),
      sortField: 'spec.suspend',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('public~Concurrency policy'),
      sortField: 'spec.concurrencyPolicy',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('public~Starting deadline seconds'),
      sortField: 'spec.startingDeadlineSeconds',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label={CronJobModel.labelPlural}
      Header={CronJobTableHeader}
      Row={CronJobTableRow}
      virtualize
    />
  );
};

export const CronJobsPage: React.FC<CronJobsPageProps> = (props) => (
  <ListPage {...props} ListComponent={CronJobsList} kind={kind} canCreate={true} />
);

export const CronJobsDetailsPage: React.FC = (props) => {
  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceForModel(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };
  return (
    <DetailsPage
      {...props}
      kind={kind}
      customActionMenu={customActionMenu}
      pages={[
        navFactory.details(CronJobDetails),
        navFactory.editYaml(),
        navFactory.pods(CronJobPodsComponent),
        navFactory.jobs(CronJobJobsComponent),
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
};

type CronJobDetailsProps = {
  obj: CronJobKind;
};

type CronJobsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};
