import * as React from 'react';
import { Formik, FormikBag } from 'formik';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { history } from '@console/internal/components/utils';
import { k8sCreate, k8sUpdate, referenceForModel } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { PipelineKind } from '../../../types';
import { returnValidPipelineModel } from '../../../utils/pipeline-utils';
import { initialPipelineFormData } from './const';
import { sanitizeToYaml } from './form-switcher-validation';
import PipelineBuilderForm from './PipelineBuilderForm';
import { PipelineBuilderFormYamlValues, PipelineBuilderFormikValues } from './types';
import { convertBuilderFormToPipeline, convertPipelineToBuilderForm } from './utils';
import { validationSchema } from './validation-utils';

import './PipelineBuilderPage.scss';

type PipelineBuilderPageProps = {
  existingPipeline?: PipelineKind;
};

const PipelineBuilderPage: React.FC<PipelineBuilderPageProps> = (props) => {
  const { t } = useTranslation();
  const { ns } = useParams();
  const { existingPipeline } = props;

  const initialValues: PipelineBuilderFormYamlValues = {
    editorType: EditorType.Form,
    yamlData: sanitizeToYaml(initialPipelineFormData, ns, existingPipeline),
    formData: {
      ...initialPipelineFormData,
      ...(convertPipelineToBuilderForm(existingPipeline) || {}),
    },
    taskResources: {
      clusterTasks: [],
      namespacedTasks: [],
      tasksLoaded: false,
    },
  };

  const handleSubmit = (
    values: PipelineBuilderFormikValues,
    actions: FormikBag<any, PipelineBuilderFormYamlValues>,
  ) => {
    let pipeline: PipelineKind;
    if (values.editorType === EditorType.YAML) {
      try {
        pipeline = safeLoad(values.yamlData);
        if (!pipeline.metadata?.namespace) {
          pipeline.metadata.namespace = ns;
        }
      } catch (err) {
        actions.setStatus({ submitError: `Invalid YAML - ${err}` });
        return null;
      }
    } else {
      pipeline = convertBuilderFormToPipeline(values.formData, ns, existingPipeline);
    }

    let resourceCall: Promise<any>;
    const pipelineModel = returnValidPipelineModel(pipeline);
    if (existingPipeline) {
      resourceCall = k8sUpdate(pipelineModel, pipeline, ns, existingPipeline.metadata.name);
    } else {
      resourceCall = k8sCreate(pipelineModel, pipeline);
    }

    return resourceCall
      .then(() => {
        history.push(`/k8s/ns/${ns}/${referenceForModel(pipelineModel)}/${pipeline.metadata.name}`);
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <div className="odc-pipeline-builder-page">
      <DocumentTitle>{t('pipelines-plugin~Pipeline builder')}</DocumentTitle>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={history.goBack}
        validationSchema={validationSchema()}
      >
        {(formikProps) => (
          <PipelineBuilderForm
            {...formikProps}
            namespace={ns}
            existingPipeline={existingPipeline}
          />
        )}
      </Formik>
    </div>
  );
};

export default PipelineBuilderPage;
