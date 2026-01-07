/**
 * Service to manage A2UI catalog URIs.
 */
class CatalogService {
  private _catalogUris: string[] = [];

  get catalogUris(): string[] {
    return [...this._catalogUris];
  }

  addCatalogUri(uri: string): void {
    if (!this._catalogUris.includes(uri)) {
      this._catalogUris.push(uri);
    }
  }

  removeCatalogUri(uri: string): void {
    this._catalogUris = this._catalogUris.filter((u) => u !== uri);
  }

  setCatalogUris(uris: string[]): void {
    this._catalogUris = [...uris];
  }

  clearCatalogUris(): void {
    this._catalogUris = [];
  }
}

export const catalogService = new CatalogService();
