import * as React from 'react';
import {
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from '@patternfly/react-core';

export type OverviewDetailItemProps = {
  /** Details card title */
  title: string;
  children: React.ReactNode;
  /** Trigger skeleton loading component during the loading phase. */
  isLoading?: boolean;
  /** Value for a className */
  valueClassName?: string;
  /** Icon that is rendered inside of list term to the left side of the children */
  icon?: React.ReactNode;
  error?: string;
};

/** Wrapper for Patternfly Description list. Must be used inside a PF `DescriptionList`! */
export const OverviewDetailItem: React.FC<OverviewDetailItemProps> = ({
  title,
  isLoading = false,
  children,
  error,
  valueClassName,
  icon,
}) => {
  let status: React.ReactNode;

  if (error) {
    status = <span className="text-secondary">{error}</span>;
  } else if (isLoading) {
    status = <div className="skeleton-text" />;
  } else {
    status = children;
  }
  return (
    <DescriptionListGroup>
      <DescriptionListTerm icon={icon}>{title}</DescriptionListTerm>
      <DescriptionListDescription data-test="detail-item-value" className={valueClassName}>
        {status}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};
