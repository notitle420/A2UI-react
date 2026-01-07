/**
 * A2UI value resolution utilities.
 * Resolves property values from literal formats and path bindings.
 */

import { getDataByPath, normalizePath } from './data-path-resolver';

/**
 * Literal value object containing a string value.
 */
export interface LiteralString {
  literalString: string;
}

/**
 * Literal value object containing a number value.
 */
export interface LiteralNumber {
  literalNumber: number;
}

/**
 * Literal value object containing an array value.
 */
export interface LiteralArray {
  literalArray: unknown[];
}

/**
 * Literal value object containing an object value.
 */
export interface LiteralObject {
  literalObject: unknown;
}

/**
 * Path binding object that references a value in the data model.
 */
export interface PathBinding {
  path: string;
}

/**
 * Type guard: checks if value is a LiteralString.
 */
export function isLiteralString(value: unknown): value is LiteralString {
  return (
    value !== null &&
    typeof value === 'object' &&
    'literalString' in value
  );
}

/**
 * Type guard: checks if value is a LiteralNumber.
 */
export function isLiteralNumber(value: unknown): value is LiteralNumber {
  return (
    value !== null &&
    typeof value === 'object' &&
    'literalNumber' in value
  );
}

/**
 * Type guard: checks if value is a LiteralArray.
 */
export function isLiteralArray(value: unknown): value is LiteralArray {
  return (
    value !== null &&
    typeof value === 'object' &&
    'literalArray' in value
  );
}

/**
 * Type guard: checks if value is a LiteralObject.
 */
export function isLiteralObject(value: unknown): value is LiteralObject {
  return (
    value !== null &&
    typeof value === 'object' &&
    'literalObject' in value
  );
}

/**
 * Type guard: checks if value is a PathBinding.
 */
export function isPathBinding(value: unknown): value is PathBinding {
  return (
    value !== null &&
    typeof value === 'object' &&
    'path' in value &&
    typeof (value as PathBinding).path === 'string'
  );
}

/**
 * Resolves a value from A2UI property definitions.
 * Handles literal values (literalString, literalNumber, literalArray, literalObject)
 * and path bindings that reference the data model.
 *
 * @param value - The property value to resolve
 * @param dataModel - The data model Map to resolve path bindings against
 * @param dataContextPath - The current data context path for relative path resolution
 * @returns The resolved value, or the original value if not a special format
 *
 * @example
 * // Literal string
 * resolveValue({ literalString: "Hello" }, dataModel) // "Hello"
 *
 * // Path binding
 * resolveValue({ path: "user/name" }, dataModel, "/context") // value at /context/user/name
 */
export function resolveValue(
  value: unknown,
  dataModel: Map<string, unknown>,
  dataContextPath: string = '/'
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  // Handle literal values
  if (isLiteralString(value)) {
    return value.literalString;
  }
  if (isLiteralNumber(value)) {
    return value.literalNumber;
  }
  if (isLiteralArray(value)) {
    return value.literalArray;
  }
  if (isLiteralObject(value)) {
    return value.literalObject;
  }

  // Handle path bindings
  if (isPathBinding(value)) {
    const resolvedPath = normalizePath(value.path, dataContextPath);
    return getDataByPath(dataModel, resolvedPath);
  }

  return value;
}
