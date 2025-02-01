import { Injectable } from '@angular/core';
import {Observable, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";

import { Resource, ResourceType, ApiDocument } from '../contracts';
import { JsonApiDocumentSerializer } from '../serializers';
import { JsonApiStoreAdapter } from './store-adapter';
import { JsonApiDocument } from '../models';
import { ResourceMetadata } from '../metadata';

export interface Options {
    path?: string;
    respType?: ResourceType<any>
}

@Injectable()
export class JsonApiStore {

  constructor(private serializer: JsonApiDocumentSerializer, private adapter: JsonApiStoreAdapter) {}

  get<T extends Resource>(
    resType: ResourceType<T>, id: string, params?: any, options?: Options
  ): Observable<JsonApiDocument<T>> {
    const request = this.adapter.get(resType, id, params, options);

    return this.performRequest(request, resType, options) as Observable<JsonApiDocument<T>>;
  }

  getList<T extends Resource>(
    resType: ResourceType<T>, params?: any, options?: Options
  ): Observable<JsonApiDocument<T[]>> {
    const request = this.adapter.getList(resType, params, options);

    return this.performRequest(request, resType, options) as Observable<JsonApiDocument<T[]>>;
  }

  save<T extends Resource>(resources: T|T[], params?: any, options?: Options): Observable<JsonApiDocument<T|T[]>> {
    const resType = this.getResourceType(resources);

    try {
      const isNew = this.isNewResources(resources);

      if (isNew) {
        return this.create(resType, resources, params, options);
      }

      return this.update(resType, resources, params, options);
    } catch (e) {
      const doc: ApiDocument = {
        errors: [{
          id: Math.random().toString(),
          status: '400',
          title: e.message
        }]
      };

      return this.performRequest(throwError(doc), resType, options);
    }
  }

  remove<T extends Resource>(resource: T|T[], params?: any, options?: Options): Observable<JsonApiDocument<T|T[]>> {
    const resType = this.getResourceType(resource);

    let request: Observable<ApiDocument>;
    if (Array.isArray(resource)) {
      request = this.adapter.removeAll(
        resType,
        this.serializer.serializeAsId(resource),
        params,
        options
      );
    } else {
      request = this.adapter.remove(resType, resource.id, params, options);
    }

    return this.performRequest(request, resType, options);
  }

  private performRequest<T extends Resource>(
    request: Observable<ApiDocument>,
    resType: ResourceType<T>,
    options?: Options
  ): Observable<JsonApiDocument<T|T[]>> {
    return request.pipe(
      map((data: ApiDocument) => {
        return this.serializer.deserialize(data, this.getRespType(resType, options));
      }),
      catchError((error: ApiDocument|Error) => {
        if (error instanceof Error) {
          const doc = new JsonApiDocument<T|T[]>();
          doc.errors = [{title: error.message}];

          return throwError(doc);
        }

        return throwError(this.serializer.deserialize(error, this.getRespType(resType, options)));
      })
    );
  }

  private getResourceType<T extends Resource>(resource: T[] | T): ResourceType<T> {
    if (Array.isArray(resource)) {
      resource = resource[0];
    }

    return Object.getPrototypeOf(resource).constructor;
  }

  private isNewResources<T extends Resource>(resources: T[] | T): boolean {
    let isNew: boolean = null;

    if (Array.isArray(resources)) {
      resources.forEach((resource: T) => {
        const metadata = ResourceMetadata.getMetadata(resource);

        if (null === isNew) {
          isNew = metadata.isNew;
        } else if(isNew !== metadata.isNew) {
          throw new Error('You cannot create and update resources in the same time');
        }
      });
    } else {
      isNew = ResourceMetadata.getMetadata(resources).isNew;
    }

    return isNew;
  }

  private create<T extends Resource>(
    resType: ResourceType<T>,
    resources: T[] | T,
    params?: any,
    options?: Options
  ): Observable<JsonApiDocument<T|T[]>> {
    const payload = this.serializer.serialize(resources);

    return this.performRequest(this.adapter.create(resType, payload, params, options), resType, options);
  }

  private update<T extends Resource>(
    resType: ResourceType<T>,
    resources: T[] | T,
    params: any,
    options: Options
  ): Observable<JsonApiDocument<T|T[]>> {
    const payload = this.serializer.serialize(resources);

    let request: Observable<ApiDocument>;
    if (Array.isArray(resources)) {
      request = this.adapter.updateAll(resType, payload, params, options);
    } else {
      request = this.adapter.update(resType, resources.id, payload, params, options);
    }

    return this.performRequest(request, resType, options);
  }

  private getRespType<T extends Resource>(resType: ResourceType<T>, options?: Options): ResourceType<T> {
    if (options && options.respType) {
      return options.respType;
    }

    return resType;
  }
}
