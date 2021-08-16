import * as React from 'react';
import { Chip, ChipGroup, TextInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getQueryArgument, setQueryArgument } from '@console/internal/components/utils';

type NodeLogsUnitFilterProps = {
  onChangeUnit: (value: string) => void;
  unit: string;
};

const NodeLogsUnitFilter: React.FC<NodeLogsUnitFilterProps> = ({ onChangeUnit }) => {
  const unitQueryArgument = 'unit';
  const unitQueryParam = getQueryArgument(unitQueryArgument);

  const [value, setValue] = React.useState('');
  const [values, setValues] = React.useState<string[]>(
    unitQueryParam?.length > 0 ? unitQueryParam.split(',') : [],
  );
  const { t } = useTranslation();

  const getValuesString = (valuesString: string[]) => valuesString.join(',');

  React.useEffect(() => {
    const listener = (event) => {
      if ((event.code === 'Enter' || event.code === 'NumpadEnter') && value !== '') {
        event.preventDefault();
        values.push(value);
        onChangeUnit(getValuesString(values));
        setValue('');
      }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, [onChangeUnit, value, values]);

  const onChange = (newValue: string) => setValue(newValue);
  const deleteValue = (id: string) => {
    const copyOfValues = [...values];
    const index = copyOfValues.indexOf(id);
    if (index !== -1) {
      copyOfValues.splice(index, 1);
      setValues(copyOfValues);
      const valuesString = getValuesString(copyOfValues);
      setQueryArgument(unitQueryArgument, valuesString);
      onChangeUnit(valuesString);
    }
  };
  const deleteCategory = () => {
    setValues([]);
    onChangeUnit('');
  };
  const label = t('public~Filter by unit');

  return (
    <>
      <div className="co-toolbar__item">
        <TextInput
          type="text"
          id="log-unit"
          name="log-unit"
          aria-label={label}
          value={value}
          onChange={onChange}
          placeholder={label}
        />
      </div>
      <div className="co-toolbar__item">
        {values.length > 0 && (
          <ChipGroup categoryName={t('public~Unit')} isClosable onClick={deleteCategory}>
            {values?.map((v) => (
              <Chip key={v} onClick={() => deleteValue(v)}>
                {v}
              </Chip>
            ))}
          </ChipGroup>
        )}
      </div>
    </>
  );
};

export default NodeLogsUnitFilter;
