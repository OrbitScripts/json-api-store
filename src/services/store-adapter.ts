import {Injectable} from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEventType,
  HttpHeaders,
  HttpRequest,
  HttpResponse
} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {catchError, filter, map} from "rxjs/operators";

import {JsonApiUrlBuilder} from './url-builder';
import {JsonApiParamsParser} from './params-parser';
import {
  ApiDocument,
  ErrorInterceptor,
  RequestInterceptor,
  RequestParams,
  Resource,
  ResourceType,
  ResponseInterceptor
} from '../contracts';
import {Options} from "./store";


@Injectable()
export class JsonApiStoreAdapter {

  private reqInterceptors: Map<any, Set<RequestInterceptor>>;
  private respInterceptors: Map<any, Set<ResponseInterceptor>>;
  private errInterceptors: Map<any, Set<ErrorInterceptor>>;

  constructor(private http: HttpClient, private urlBuilder: JsonApiUrlBuilder, private parser: JsonApiParamsParser) {
    this.reqInterceptors = new Map();
    this.respInterceptors = new Map();
    this.errInterceptors = new Map();
  }

  /**
     * Register request interceptor
     *
     * You can use {@link RequestInterceptor} to adjust request options before
     * actual request will be sent. For example, it can be used to add API key
     * to request headers:
     *
     * ```typescript
     *
     * const interceptor: RequestInterceptor = (options: RequestOptions) => {
     *   options.headers.set('Authorization', 'YOUR_API_KEY_WILL_BE_HERE');
     * };
     * adapter.addRequestInterceptor(interceptor);
     *
     * ```
     *
     * If second parameter specified, registered interceptor will be called only
     * before requests related to specified resource type:
     *
     * ```typescript
     * const resType: ResourceType<User> = User;
     * const interceptor: RequestInterceptor = (options: RequestOptions) => {
     *   // ... perform some work here
     * };
     * adapter.addRequestInterceptor(interceptor, resType);
     * ```
     */
  addRequestInterceptor<T extends Resource>(
    interceptor: RequestInterceptor,
    resType: ResourceType<T>|string = 'global'
  ): JsonApiStoreAdapter {
    if (!this.reqInterceptors.has(resType)) {
      this.reqInterceptors.set(resType, new Set());
    }

    this.reqInterceptors.get(resType).add(interceptor);

    return this;
  }

  /**
     * Register response interceptor
     *
     * You can use {@link ResponseInterceptor} to adjust response before
     * it will be processed by `JsonApiStoreAdapter'.
     */
  addResponseInterceptor<T extends Resource>(
    interceptor: ResponseInterceptor,
    resType: ResourceType<T>|string = 'global'
  ): JsonApiStoreAdapter {
    if (!this.respInterceptors.has(resType)) {
      this.respInterceptors.set(resType, new Set());
    }

    this.respInterceptors.get(resType).add(interceptor);

    return this;
  }

  /**
     * Register errors interceptor
     */
  addErrorInterceptor<T extends Resource>(
    interceptor: ErrorInterceptor,
    resType: ResourceType<T>|string = 'global'
  ): JsonApiStoreAdapter {
    if (!this.errInterceptors.has(resType)) {
      this.errInterceptors.set(resType, new Set());
    }

    this.errInterceptors.get(resType).add(interceptor);

    return this;
  }

  get<T extends Resource>(
    resType: ResourceType<T>, id: string, params?: any, options?: Options
  ): Observable<ApiDocument> {
    let url: string;
    if (options && options.path) {
      url = this.urlBuilder.getCustomUrl(options.path);
    } else {
      url = this.urlBuilder.getResourceUrl(resType, id);
    }

    return this.sendRequest(resType, url, "GET", params);
  }

  getList<T extends Resource>(resType: ResourceType<T>, params?: any, options?: Options): Observable<ApiDocument> {
    let url:string;
    if (options && options.path) {
      url = this.urlBuilder.getCustomUrl(options.path);
    } else {
      url = this.urlBuilder.getResourceListUrl(resType);
    }

    return this.sendRequest(resType, url, "GET", params);
  }

  create<T extends Resource>(
    resType: ResourceType<T>, payload: ApiDocument, params?: any, options?: Options
  ): Observable<ApiDocument> {
    let url: string;
    if (options && options.path) {
      url = this.urlBuilder.getCustomUrl(options.path);
    } else {
      url = this.urlBuilder.getResourceListUrl(resType);
    }

    return this.sendRequest(resType, url, "POST", params, payload);
  }

  update<T extends Resource>(
    resType: ResourceType<T>,
    id: string,
    payload: ApiDocument,
    params?: any,
    options?: Options
  ): Observable<ApiDocument> {
    let url: string;
    if (options && options.path) {
      url = this.urlBuilder.getCustomUrl(options.path);
    } else {
      url = this.urlBuilder.getResourceUrl(resType, id);
    }

    return this.sendRequest(resType, url, "PATCH", params, payload);
  }

  updateAll<T extends Resource>(
    resType: ResourceType<T>,
    payload: ApiDocument,
    params?: any,
    options?: Options
  ): Observable<ApiDocument> {
    let url: string;
    if (options && options.path) {
      url = this.urlBuilder.getCustomUrl(options.path);
    } else {
      url = this.urlBuilder.getResourceListUrl(resType);
    }

    return this.sendRequest(resType, url, "PATCH", params, payload);
  }

  remove<T extends Resource>(
    resType: ResourceType<T>, id: string, params?: any, options?: Options
  ): Observable<ApiDocument> {
    let url: string;
    if (options && options.path) {
      url = this.urlBuilder.getCustomUrl(options.path);
    } else {
      url = this.urlBuilder.getResourceUrl(resType, id);
    }

    return this.sendRequest(resType, url, "DELETE", params);
  }

  removeAll<T extends Resource>(
    resType: ResourceType<T>,
    payalod: ApiDocument,
    params?: any,
    options?: Options
  ): Observable<ApiDocument> {
    let url: string;
    if (options && options.path) {
      url = this.urlBuilder.getCustomUrl(options.path);
    } else {
      url = this.urlBuilder.getResourceListUrl(resType);
    }

    return this.sendRequest(resType, url, "DELETE", params, payalod);
  }

  private sendRequest<T extends Resource>(
    resType: ResourceType<T>,
    url: string,
    method: string,
    params?: any,
    body?: ApiDocument
  ): Observable<ApiDocument> {
    const request = this.prepareRequest(resType, url, method, params, body);

    return this.http.request<ApiDocument>(request).pipe(
      filter((resp: HttpResponse<ApiDocument>) => resp.type === HttpEventType.Response),
      map((response: HttpResponse<ApiDocument>) => this.parseResponse(resType, method, response)),
      catchError(error => this.handleError(resType, error))
    );
  }

  private prepareRequest<T extends Resource>(
    resType: ResourceType<T>,
    url: string,
    method: string,
    params?: any,
    body?: ApiDocument
  ): HttpRequest<ApiDocument> {
    const reqParams: RequestParams = {
      url: url,
      method: method,
      body: body,
      query: (params) ? this.parser.parse(params) : undefined,
      headers: new HttpHeaders({
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      })
    };

    if (this.reqInterceptors.has('global')) {
      this.reqInterceptors.get('global').forEach((interceptor: RequestInterceptor) => {
        interceptor(reqParams);
      });
    }

    if (this.reqInterceptors.has(resType)) {
      this.reqInterceptors.get(resType).forEach((interceptor: RequestInterceptor) => {
        interceptor(reqParams);
      });
    }

    return new HttpRequest(
      reqParams.method,
      reqParams.url,
      reqParams.body,
      {params: reqParams.query, headers: reqParams.headers, responseType: 'json', reportProgress: false}
    );
  }

  private parseResponse<T extends Resource>(
    resType: ResourceType<T>,
    method: string,
    response: HttpResponse<ApiDocument>
  ): ApiDocument {
    if (this.respInterceptors.has('global')) {
      this.respInterceptors.get('global').forEach((interceptor: ResponseInterceptor) => {
        interceptor(response, method);
      });
    }

    if (this.respInterceptors.has(resType)) {
      this.respInterceptors.get(resType).forEach((interceptor: ResponseInterceptor) => {
        interceptor(response, method);
      });
    }

    return response.body;
  }

  private handleError<T extends Resource>(
    resType: ResourceType<T>,
    error: HttpErrorResponse
  ): Observable<ApiDocument> {

    if (this.errInterceptors.has('global')) {
      this.errInterceptors.get('global').forEach((interceptor: ErrorInterceptor) => {
        interceptor(error);
      });
    }

    if (this.errInterceptors.has(resType)) {
      this.errInterceptors.get(resType).forEach((interceptor: ErrorInterceptor) => {
        interceptor(error);
      });
    }

    let doc: ApiDocument;
    if (error.error) {
      doc = error.error;
    } else {
      doc = {
        errors: [
          {
            id: Math.random().toString(),
            status: error.status.toString(),
            title: error.statusText
          }
        ]
      };
    }

    return throwError(doc);
  }
}