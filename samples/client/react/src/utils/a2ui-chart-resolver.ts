/**
 * A2UI chart data resolution utilities.
 * Resolves chart data from A2UI data model with drill-down support.
 */

import { getDataByPath, normalizePath } from './data-path-resolver';
import { isLiteralArray, isPathBinding } from './a2ui-value-resolver';
import type { ChartDataItem } from '@/components/a2ui-catalog/Chart';

/** Maximum number of items to iterate when resolving chart data */
const MAX_ITEMS = 100;

/**
 * Extracts drill-down items for a chart item at the given index.
 *
 * @param dataModel - The data model Map
 * @param basePath - Base path to the chart data array
 * @param itemIndex - Index of the parent chart item
 * @returns Array of drill-down ChartDataItems
 */
export function extractDrillDownItems(
  dataModel: Map<string, unknown>,
  basePath: string,
  itemIndex: number
): ChartDataItem[] {
  const drillDownItems: ChartDataItem[] = [];

  for (let j = 0; j < MAX_ITEMS; j++) {
    const ddLabelPath = `${basePath}/${itemIndex}/drillDown/${j}/label`;
    const ddValuePath = `${basePath}/${itemIndex}/drillDown/${j}/value`;

    const ddLabel = getDataByPath(dataModel, ddLabelPath);
    const ddValue = getDataByPath(dataModel, ddValuePath);

    if (ddLabel === undefined || ddValue === undefined) {
      break;
    }

    drillDownItems.push({
      label: String(ddLabel),
      value: Number(ddValue),
    });
  }

  return drillDownItems;
}

/**
 * Extracts a single chart item from the data model at the given index.
 *
 * @param dataModel - The data model Map
 * @param basePath - Base path to the chart data array
 * @param index - Index of the chart item to extract
 * @returns ChartDataItem or null if not found
 */
export function extractChartItem(
  dataModel: Map<string, unknown>,
  basePath: string,
  index: number
): ChartDataItem | null {
  const labelPath = `${basePath}/${index}/label`;
  const valuePath = `${basePath}/${index}/value`;

  const label = getDataByPath(dataModel, labelPath);
  const value = getDataByPath(dataModel, valuePath);

  if (label === undefined || value === undefined) {
    return null;
  }

  const item: ChartDataItem = {
    label: String(label),
    value: Number(value),
  };

  // Check for drill-down data
  const drillDownItems = extractDrillDownItems(dataModel, basePath, index);
  if (drillDownItems.length > 0) {
    item.drillDown = drillDownItems;
  }

  return item;
}

/**
 * Resolves chart data from the data model, including drill-down data.
 * Handles both literalArray values and path bindings.
 *
 * @param chartDataPath - The chart data property value (literalArray or path binding)
 * @param dataModel - The data model Map
 * @param dataContextPath - Current data context path for relative path resolution
 * @returns Array of ChartDataItems
 *
 * @example
 * // From path binding
 * resolveChartData({ path: "salesData" }, dataModel, "/")
 *
 * // From literal array
 * resolveChartData({ literalArray: [{ label: "A", value: 10 }] }, dataModel)
 */
export function resolveChartData(
  chartDataPath: unknown,
  dataModel: Map<string, unknown>,
  dataContextPath: string = '/'
): ChartDataItem[] {
  if (!chartDataPath || typeof chartDataPath !== 'object') {
    return [];
  }

  // Handle literalArray
  if (isLiteralArray(chartDataPath)) {
    return chartDataPath.literalArray as ChartDataItem[];
  }

  // Handle path binding
  if (isPathBinding(chartDataPath)) {
    const basePath = normalizePath(chartDataPath.path, dataContextPath);
    const items: ChartDataItem[] = [];

    for (let i = 0; i < MAX_ITEMS; i++) {
      const item = extractChartItem(dataModel, basePath, i);
      if (item === null) {
        break;
      }
      items.push(item);
    }

    return items;
  }

  return [];
}
