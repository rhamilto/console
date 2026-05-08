import type { IconDefinition, IconData } from '@patternfly/react-icons/dist/esm/createIcon';

const ICON_OPERATOR = 'icon-operator';
export type CSVIcon = { base64data: string; mediatype: string };
export const getImageForCSVIcon = (icon: CSVIcon | undefined) => {
  return icon ? `data:${icon.mediatype};base64,${icon.base64data}` : ICON_OPERATOR;
};

export const getDefaultOperatorIcon = () => ICON_OPERATOR;

/**
 * Modified from PF createIcon, returns a string with the SVG element instead of a React component.
 * Supports both old IconDefinition format and new IconConfig format with nested icon property.
 */
export const getSvgFromPfIconConfig = (
  iconConfig: IconDefinition | { icon: IconData; [key: string]: any },
  className?: string,
): string => {
  // Handle new format where icon data is nested under 'icon' property (IconData type)
  const iconDef: IconDefinition | IconData = 'icon' in iconConfig ? iconConfig.icon : iconConfig;
  const { xOffset = 0, yOffset = 0, width, height } = iconDef;
  // IconDefinition uses 'svgPath', IconData uses 'svgPathData'
  const pathData =
    'svgPath' in iconDef && iconDef.svgPath
      ? iconDef.svgPath
      : 'svgPathData' in iconDef
      ? iconDef.svgPathData
      : '';
  const viewBox = [xOffset, yOffset, width, height].join(' ');

  return `
<svg className="pf-v6-svg ${className || ''}"
  viewBox='${viewBox}'
  fill="currentColor"
  role="img"
  width="1em"
  height="1em"
>
    <path d='${pathData}' />
</svg>`;
};
