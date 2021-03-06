import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { useTranslation, Trans } from 'react-i18next';
import { useQueryParams } from '@console/shared';
import { Button } from '@patternfly/react-core';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CatalogServiceProvider from './service/CatalogServiceProvider';
import CatalogController from './CatalogController';
import { CatalogQueryParams } from './utils/types';

type CatalogPageProps = RouteComponentProps<{
  ns?: string;
}>;

const CatalogPage: React.FC<CatalogPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const catalogType = queryParams.get(CatalogQueryParams.TYPE);
  const namespace = match.params.ns;

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      {namespace ? (
        <CatalogServiceProvider namespace={namespace} catalogType={catalogType}>
          {(service) => <CatalogController {...service} />}
        </CatalogServiceProvider>
      ) : (
        <CreateProjectListPage title={t('devconsole~Developer Catalog')}>
          {(openProjectModal) => (
            <Trans t={t} ns="devconsole">
              Select a Project to view the developer catalog or{' '}
              <Button isInline variant="link" onClick={openProjectModal}>
                create a Project
              </Button>
              .
            </Trans>
          )}
        </CreateProjectListPage>
      )}
    </NamespacedPage>
  );
};

export default CatalogPage;
