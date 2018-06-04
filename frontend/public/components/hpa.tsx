import * as React from 'react';
// eslint-disable-next-line no-unused-vars
import { K8sResourceKindReference } from '../module/k8s';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, LabelList, navFactory, ResourceCog, ResourceLink, ResourceSummary, Timestamp } from './utils';
import { registerTemplate } from '../yaml-templates';

// Pushes to the HPA created by the HPA YAML template.
registerTemplate('autoscaling/v2beta1.HorizontalPodAutoscaler', `apiVersion: autoscaling/v2beta1
kind: HorizontalPodAutoscaler
metadata:
  name: example
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: example
  minReplicas: 1
  maxReplicas: 3
  metrics:
  - type: Resource
    resource:
      name: cpu
      targetAverageUtilization: 50`);

const HorizontalPodAutoscalersReference: K8sResourceKindReference = 'HorizontalPodAutoscaler';

const { common } = Cog.factory;

const menuActions = [
  ...common,
];

export const HorizontalPodAutoscalersDetails: React.SFC<HorizontalPodAutoscalersDetailsProps> = ({obj: hpa}) => {
  let type, target;
  const namespace = hpa.metadata.namespace;

  const metrics = hpa.spec.metrics.map((metric, i) => {
    switch (metric.type) {
      case 'External':
        type = metric.external.metricName;
        target = metric.external.targetAverageValue || metric.external.targetValue;
        break;
      case 'Object':
        type = [`${metric.object.metricName} on`, <ResourceLink kind={metric.object.target.kind} name={metric.object.target.name} namespace={namespace} title={metric.object.target.name} key={i} />];
        target = metric.object.targetValue;
        break;
      case 'Pods':
        type = `${metric.pods.metricName} on pods`;
        target = metric.pods.targetAverageValue;
        break;
      case 'Resource':
        type = `resource ${metric.resource.name} on pods`;
        target = metric.resource.targetAverageUtilization || metric.resource.targetAverageValue;
        if (metric.resource.targetAverageUtilization) {
          type += ' (as a percentage of request)';
          target += '%';
        }
        break;
      default:
        type = metric.type;
    }
    return <div className="row" key={i}>
      <div className="col-xs-6">
        {type}
      </div>
      <div className="col-xs-3">
        &nbsp;
      </div>
      <div className="col-xs-3">
        {target}
      </div>
    </div>;
  });

  const conditions = hpa.status.conditions.map((condition, i) => <div className="row" key={i}>
    <div className="col-xs-3 col-sm-2">
      {condition.type}
    </div>
    <div className="col-xs-3 col-sm-2">
      {condition.status}
    </div>
    <div className="col-xs-3 col-sm-3">
      {condition.reason}
    </div>
    <div className="col-xs-3 col-sm-5">
      {condition.message}
    </div>
  </div>);

  return <React.Fragment>
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={hpa} showPodSelector={false} showNodeSelector={false} />
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>Scale Target</dt>
            <dd>
              <ResourceLink kind={hpa.spec.scaleTargetRef.kind} name={hpa.spec.scaleTargetRef.name} namespace={hpa.metadata.namespace} title={hpa.spec.scaleTargetRef.name} />
            </dd>
            <dt>Min Pods</dt>
            <dd>{hpa.spec.minReplicas}</dd>
            <dt>Max Pods</dt>
            <dd>{hpa.spec.maxReplicas}</dd>
            <dt>Last Scale Time</dt>
            <dd><Timestamp timestamp={hpa.status.lastScaleTime} /></dd>
            <dt>Current Pods</dt>
            <dd>{hpa.status.currentReplicas}</dd>
            <dt>Desired Pods</dt>
            <dd>{hpa.status.desiredReplicas}</dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <h1 className="co-section-title">Metrics</h1>
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-xs-6">Type</div>
          <div className="col-xs-3">Current</div>
          <div className="col-xs-3">Target</div>
        </div>
        <div className="co-m-table-grid__body">
          {metrics}
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <h1 className="co-section-title">Conditions</h1>
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-xs-3 col-sm-2">Type</div>
          <div className="col-xs-3 col-sm-2">Status</div>
          <div className="col-xs-3 col-sm-3">Reason</div>
          <div className="col-xs-3 col-sm-5">Message</div>
        </div>
        <div className="co-m-table-grid__body">
          {conditions}
        </div>
      </div>
    </div>
  </React.Fragment>;
};

const pages = [navFactory.details(HorizontalPodAutoscalersDetails), navFactory.editYaml()];
export const HorizontalPodAutoscalersDetailsPage: React.SFC<HorizontalPodAutoscalersDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={HorizontalPodAutoscalersReference}
    menuActions={menuActions}
    pages={pages} />;
HorizontalPodAutoscalersDetailsPage.displayName = 'HorizontalPodAutoscalersDetailsPage';

const HorizontalPodAutoscalersHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6 " sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 hidden-sm hidden-xs" sortField="spec.scaleTargetRef.name">Scale Target</ColHead>
  <ColHead {...props} className="col-lg-1 hidden-md hidden-sm hidden-xs" sortField="spec.minReplicas">Min Pods</ColHead>
  <ColHead {...props} className="col-lg-1 hidden-md hidden-sm hidden-xs" sortField="spec.maxReplicas">Max Pods</ColHead>
</ListHeader>;

const HorizontalPodAutoscalersRow: React.SFC<HorizontalPodAutoscalersRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
    <ResourceCog actions={menuActions} kind={HorizontalPodAutoscalersReference} resource={obj} />
    <ResourceLink kind={HorizontalPodAutoscalersReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
    <LabelList kind="HorizontalPodAutoscaler" labels={obj.metadata.labels} />
  </div>
  <div className="col-lg-2 col-md-3 hidden-sm hidden-xs">
    <ResourceLink kind={obj.spec.scaleTargetRef.kind} name={obj.spec.scaleTargetRef.name} namespace={obj.metadata.namespace} title={obj.spec.scaleTargetRef.name} />
  </div>
  <div className="col-lg-1 hidden-md hidden-sm hidden-xs">
    {obj.spec.minReplicas}
  </div>
  <div className="col-lg-1 hidden-md hidden-sm hidden-xs">
    {obj.spec.maxReplicas}
  </div>
</div>;

const HorizontalPodAutoscalersList: React.SFC = props => <List {...props} Header={HorizontalPodAutoscalersHeader} Row={HorizontalPodAutoscalersRow} />;
HorizontalPodAutoscalersList.displayName = 'HorizontalPodAutoscalersList';

export const HorizontalPodAutoscalersPage: React.SFC<HorizontalPodAutoscalersPageProps> = props =>
  <ListPage
    {...props}
    kind={HorizontalPodAutoscalersReference}
    ListComponent={HorizontalPodAutoscalersList}
    canCreate={true}
    filterLabel="HPAs by name"
  />;
HorizontalPodAutoscalersPage.displayName = 'HorizontalPodAutoscalersListPage';

/* eslint-disable no-undef */
export type HorizontalPodAutoscalersRowProps = {
  obj: any,
};

export type HorizontalPodAutoscalersDetailsProps = {
  obj: any,
};

export type HorizontalPodAutoscalersPageProps = {
  showTitle?: boolean,
  namespace?: string,
  selector?: any,
};

export type HorizontalPodAutoscalersDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */
