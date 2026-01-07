/**
 * Data path resolution utilities for A2UI.
 * Provides functions to traverse and resolve values from nested data structures.
 */

/**
 * Parses a path string into normalized segments.
 * Supports multiple notations: "/", ".", and "[n]" bracket notation.
 *
 * @example
 * parsePathSegments("/users/0/name") // ["users", "0", "name"]
 * parsePathSegments("users.items[0].label") // ["users", "items", "0", "label"]
 */
export function parsePathSegments(path: string): string[] {
  return path
    .replace(/^\//, '') // Remove leading /
    .replace(/\[(\d+)\]/g, '/$1') // Convert [n] to /n
    .replace(/\./g, '/') // Convert . to /
    .split('/') // Split by /
    .filter((s) => s.length > 0);
}

/**
 * Normalizes a path with a context path.
 * Handles both absolute (starts with /) and relative paths.
 *
 * @example
 * normalizePath("name", "/users/0") // "/users/0/name"
 * normalizePath("/absolute/path", "/context") // "/absolute/path"
 */
export function normalizePath(path: string, contextPath: string = '/'): string {
  if (path.startsWith('/')) {
    return path;
  }
  return `${contextPath}/${path}`.replace(/\/+/g, '/');
}

/**
 * Retrieves data from a nested data structure by path.
 * Supports traversal of Map, Array, and plain Object structures.
 *
 * @param dataModel - The root data structure (typically a Map)
 * @param path - Path to the desired value (e.g., "/users/0/name", "items[0].label")
 * @returns The value at the path, or undefined if not found
 *
 * @example
 * const dataModel = new Map([["users", [{ name: "Alice" }]]]);
 * getDataByPath(dataModel, "/users/0/name") // "Alice"
 */
export function getDataByPath(
  dataModel: Map<string, unknown>,
  path: string
): unknown {
  const segments = parsePathSegments(path);

  let current: unknown = dataModel;
  for (const segment of segments) {
    if (current instanceof Map) {
      current = current.get(segment);
    } else if (Array.isArray(current) && /^\d+$/.test(segment)) {
      current = current[parseInt(segment, 10)];
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}
