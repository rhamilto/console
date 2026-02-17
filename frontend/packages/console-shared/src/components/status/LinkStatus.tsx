import type { FC, ComponentProps } from 'react';
import type { To } from 'react-router-dom-v5-compat';
import { Link } from 'react-router-dom-v5-compat';
import { StatusIconAndText } from '@console/dynamic-plugin-sdk';

const LinkStatus: FC<LinkStatusProps> = ({ linkTitle, linkTo, ...other }) =>
  linkTo ? (
    <Link to={linkTo} title={linkTitle}>
      <StatusIconAndText {...other} />
    </Link>
  ) : (
    <StatusIconAndText {...other} />
  );

type LinkStatusProps = ComponentProps<typeof StatusIconAndText> & {
  linkTitle?: string;
  linkTo?: To;
};

export default LinkStatus;
