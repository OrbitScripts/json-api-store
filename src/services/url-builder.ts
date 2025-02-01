import { Inject, Injectable, InjectionToken } from '@angular/core';

import { Resource, ResourceType } from '../contracts';
import { ModelMetadata } from '../metadata';

export const JSON_API_BASE_URL = new InjectionToken<string>('json_api.base_url');

@Injectable()
export class JsonApiUrlBuilder {

  private baseUrl: string;

  constructor(@Inject(JSON_API_BASE_URL) baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  getResourceUrl<T extends Resource>(resType: ResourceType<T>, id: string): string {
    return this.getResourceListUrl(resType) + '/' + id;
  }

  getResourceListUrl<T extends Resource>(resType: ResourceType<T>): string {
    return this.baseUrl + JsonApiUrlBuilder.getResourcePath(resType);
  }

  getCustomUrl(path: string): string {
    return this.baseUrl + path;
  }

  private static getResourcePath<T extends Resource>(resType: ResourceType<T>): string {
    const metadata = ModelMetadata.getClassMetadata(resType);

    return (metadata.path) ? metadata.path : '/' + metadata.type;
  }
}