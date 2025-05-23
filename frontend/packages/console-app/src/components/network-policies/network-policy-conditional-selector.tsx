import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useTranslation } from 'react-i18next';
import { AsyncComponent, AsyncComponentProps } from '@console/internal/components/utils/async';

const NameValueEditorComponent = (props: Omit<AsyncComponentProps, 'loader'>) => (
  <AsyncComponent
    loader={() =>
      import('@console/internal/components/utils/name-value-editor').then((c) => c.NameValueEditor)
    }
    {...props}
  />
);

type NetworkPolicyConditionalSelectorProps = {
  selectorType: 'pod' | 'namespace';
  helpText: string;
  values: string[][];
  onChange: (pairs: string[][]) => void;
  dataTest?: string;
};

export const NetworkPolicyConditionalSelector: React.FunctionComponent<NetworkPolicyConditionalSelectorProps> = (
  props,
) => {
  const { t } = useTranslation();
  const { selectorType, helpText, values, onChange, dataTest } = props;
  const [isVisible, setVisible] = React.useState(values.length > 0);

  const handleSelectorChange = (updated: { nameValuePairs: string[][] }) => {
    onChange(updated.nameValuePairs);
  };

  const title =
    selectorType === 'pod' ? t('console-app~Pod selector') : t('console-app~Namespace selector');
  const addSelectorText =
    selectorType === 'pod'
      ? t('console-app~Add pod selector')
      : t('console-app~Add namespace selector');
  const secondHelpText =
    selectorType === 'pod'
      ? t('console-app~Pods having all the supplied key/value pairs as labels will be selected.')
      : t(
          'console-app~Namespaces having all the supplied key/value pairs as labels will be selected.',
        );

  return (
    <>
      <span>
        <label>{title}</label>
      </span>
      <div className="help-block">
        <p className="co-create-networkpolicy__paragraph">{helpText}</p>
      </div>
      {isVisible ? (
        <>
          <div className="help-block">
            <p className="co-create-networkpolicy__paragraph">{secondHelpText}</p>
          </div>
          <NameValueEditorComponent
            nameValuePairs={values.length > 0 ? values : [['', '']]}
            valueString={t('console-app~Selector')}
            nameString={t('console-app~Label')}
            addString={t('console-app~Add label')}
            readOnly={false}
            allowSorting={false}
            updateParentData={handleSelectorChange}
            onLastItemRemoved={() => setVisible(false)}
          />
        </>
      ) : (
        <div className="co-create-networkpolicy__show-selector">
          <Button
            icon={<PlusCircleIcon className="co-icon-space-r" />}
            className="pf-m-link--align-left"
            onClick={() => setVisible(true)}
            type="button"
            variant="link"
            data-test={dataTest ? `add-${dataTest}` : 'add-labels-selector'}
          >
            {addSelectorText}
          </Button>
        </div>
      )}
    </>
  );
};
