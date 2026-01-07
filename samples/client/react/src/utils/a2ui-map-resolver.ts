/**
 * A2UI map data resolution utilities.
 * Resolves Google Map pins and center coordinates from A2UI data model.
 */

import { getDataByPath, normalizePath } from './data-path-resolver';
import { isLiteralArray, isLiteralObject, isPathBinding } from './a2ui-value-resolver';
import type { MapPin } from '@/components/a2ui-catalog/GoogleMap';

/** Maximum number of pins to iterate when resolving map data */
const MAX_PINS = 100;

/**
 * Coordinates type for map center.
 */
export interface MapCoordinates {
  lat: number;
  lng: number;
}

/**
 * Resolves Google Map pins from the data model.
 * Handles both literalArray values and path bindings.
 *
 * @param pinsPath - The pins property value (literalArray or path binding)
 * @param dataModel - The data model Map
 * @param dataContextPath - Current data context path for relative path resolution
 * @returns Array of MapPins
 *
 * @example
 * resolveMapPins({ path: "locations" }, dataModel, "/")
 */
export function resolveMapPins(
  pinsPath: unknown,
  dataModel: Map<string, unknown>,
  dataContextPath: string = '/'
): MapPin[] {
  if (!pinsPath || typeof pinsPath !== 'object') {
    return [];
  }

  // Handle literalArray
  if (isLiteralArray(pinsPath)) {
    return pinsPath.literalArray as MapPin[];
  }

  // Handle path binding
  if (isPathBinding(pinsPath)) {
    const basePath = normalizePath(pinsPath.path, dataContextPath);
    const pins: MapPin[] = [];

    for (let i = 0; i < MAX_PINS; i++) {
      const latPath = `${basePath}/${i}/lat`;
      const lngPath = `${basePath}/${i}/lng`;
      const namePath = `${basePath}/${i}/name`;
      const descriptionPath = `${basePath}/${i}/description`;

      const lat = getDataByPath(dataModel, latPath);
      const lng = getDataByPath(dataModel, lngPath);

      if (lat === undefined || lng === undefined) {
        break;
      }

      const name = getDataByPath(dataModel, namePath);
      const description = getDataByPath(dataModel, descriptionPath);

      pins.push({
        lat: Number(lat),
        lng: Number(lng),
        name: name ? String(name) : undefined,
        description: description ? String(description) : undefined,
      });
    }

    return pins;
  }

  return [];
}

/**
 * Resolves map center coordinates from the data model.
 * Handles both literalObject values and path bindings.
 *
 * @param centerPath - The center property value (literalObject or path binding)
 * @param dataModel - The data model Map
 * @param dataContextPath - Current data context path for relative path resolution
 * @returns MapCoordinates or undefined if not found/invalid
 *
 * @example
 * resolveMapCenter({ literalObject: { lat: 35.6762, lng: 139.6503 } }, dataModel)
 * resolveMapCenter({ path: "mapCenter" }, dataModel, "/")
 */
export function resolveMapCenter(
  centerPath: unknown,
  dataModel: Map<string, unknown>,
  dataContextPath: string = '/'
): MapCoordinates | undefined {
  if (!centerPath || typeof centerPath !== 'object') {
    return undefined;
  }

  // Handle literalObject
  if (isLiteralObject(centerPath)) {
    const obj = centerPath.literalObject as { lat?: number; lng?: number };
    if (obj.lat !== undefined && obj.lng !== undefined) {
      return { lat: obj.lat, lng: obj.lng };
    }
    return undefined;
  }

  // Handle path binding
  if (isPathBinding(centerPath)) {
    const basePath = normalizePath(centerPath.path, dataContextPath);

    const lat = getDataByPath(dataModel, `${basePath}/lat`);
    const lng = getDataByPath(dataModel, `${basePath}/lng`);

    if (lat !== undefined && lng !== undefined) {
      return { lat: Number(lat), lng: Number(lng) };
    }
  }

  return undefined;
}
