import type { FC } from 'react';
import { Button, Form, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import ResourceLimitSection from '@console/dev-console/src/components/import/advanced/ResourceLimitSection';
import { ModalErrorContent } from '@console/shared/src/components/modal-error-content';

interface ResourceLimitsModalProps {
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & ResourceLimitsModalProps;

const ResourceLimitsModal: FC<Props> = ({ handleSubmit, cancel, isSubmitting, status, errors }) => {
  const { t } = useTranslation();
  return (
    <>
      <ModalHeader title={t('console-app~Edit resource limits')} />
      <ModalBody>
        <Form
          id="resource-limits-form"
          onSubmit={handleSubmit}
          aria-label={t('console-app~Edit resource limits modal')}
        >
          <ResourceLimitSection hideTitle />
        </Form>
      </ModalBody>
      <ModalFooter className="pf-v6-u-flex-wrap">
        <ModalErrorContent errorMessage={status?.submitError} />
        <Button
          variant="primary"
          type="submit"
          form="resource-limits-form"
          isLoading={isSubmitting}
          isDisabled={!_.isEmpty(errors) || isSubmitting}
        >
          {t('console-app~Save')}
        </Button>
        <Button variant="link" onClick={cancel}>
          {t('console-app~Cancel')}
        </Button>
      </ModalFooter>
    </>
  );
};

export default ResourceLimitsModal;
