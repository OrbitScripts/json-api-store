import {getTestBed, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {HttpResponse} from "@angular/common/http";

import { JsonApiParamsParser } from './params-parser';
import { JSON_API_BASE_URL, JsonApiUrlBuilder } from './url-builder';
import { ApiDocument, RequestInterceptor, ResponseInterceptor } from '../contracts';
import { JsonApiStoreAdapter } from './store-adapter';
import { User } from '../../test/models/user.model';
import { ApiError } from '../contracts/api';
import {Options} from "./store";

describe("Services", () => {
  describe('JsonApiStoreAdapter', () => {
    let backend: HttpTestingController;
    let builder: JsonApiUrlBuilder;
    let parser: JsonApiParamsParser;
    let adapter: JsonApiStoreAdapter;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: JSON_API_BASE_URL, useValue: 'http://api.com/v1'},
          JsonApiUrlBuilder,
          JsonApiParamsParser,
          JsonApiStoreAdapter,
        ]
      });

      const injector = getTestBed();
      backend = injector.get(HttpTestingController);
      builder = injector.get(JsonApiUrlBuilder);
      parser = injector.get(JsonApiParamsParser);
      adapter = injector.get(JsonApiStoreAdapter);
    });

    afterEach(() => {
      backend.verify();
    });

    it('should load single resource', async () => {
      const userId = '123';
      const response: ApiDocument = require('../../test/documents/user.json');
      const params = {
        include: ['offices', 'user-roles']
      };

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getResourceUrl(User, userId) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getResourceUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.get(User, userId, params).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getResourceUrl).toHaveBeenCalledWith(User, userId);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('GET');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('GET');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('GET');
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(response);
    });

    it('should load single resource with custom path', async () => {
      const userId = '123';
      const response: ApiDocument = require('../../test/documents/user.json');
      const params = {
        include: ['offices', 'user-roles']
      };
      const options: Options = {path: "/custom"};

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getCustomUrl(options.path) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getCustomUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.get(User, userId, params, options).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getCustomUrl).toHaveBeenCalledWith(options.path);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('GET');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('GET');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('GET');
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(response);
    });

    it('should load list of resources', () => {
      const response: ApiDocument = require('../../test/documents/user.json');
      const params = {
        include: ['offices', 'user-roles'],
        page: {
          number: 1,
          size: 10
        }
      };

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getResourceListUrl(User) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getResourceListUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.getList(User, params).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getResourceListUrl).toHaveBeenCalledWith(User);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('GET');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('GET');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('GET');
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(response);
    });

    it('should load list of resources with custom path', () => {
      const response: ApiDocument = require('../../test/documents/user.json');
      const params = {
        include: ['offices', 'user-roles'],
        page: {
          number: 1,
          size: 10
        }
      };
      const options: Options = {path: "/custom"};

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getCustomUrl(options.path) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getCustomUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.getList(User, params, options).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getCustomUrl).toHaveBeenCalledWith(options.path);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('GET');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('GET');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('GET');
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(response);
    });

    it('should create new resource', () => {
      const params = {include: ['offices', 'user-roles']};
      const payload = require('../../test/documents/create-user.json');
      const response = require('../../test/documents/user.json');

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getResourceListUrl(User) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getResourceListUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.create(User, payload, params).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getResourceListUrl).toHaveBeenCalledWith(User);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('POST');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('POST');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('POST');
      expect(apiReq.request.body).toEqual(payload);
      expect(apiReq.request.headers.get('Content-Type')).toEqual(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toEqual(expectedMediaType);
      apiReq.flush(response, {status: 201, statusText: 'Created'});
    });

    it('should create new resource with custom path', () => {
      const params = {include: ['offices', 'user-roles']};
      const payload = require('../../test/documents/create-user.json');
      const response = require('../../test/documents/user.json');
      const options: Options = {path: "/custom"};

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getCustomUrl(options.path) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getCustomUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.create(User, payload, params, options).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getCustomUrl).toHaveBeenCalledWith(options.path);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('POST');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('POST');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('POST');
      expect(apiReq.request.body).toEqual(payload);
      expect(apiReq.request.headers.get('Content-Type')).toEqual(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toEqual(expectedMediaType);
      apiReq.flush(response, {status: 201, statusText: 'Created'});
    });

    it('should update single resource', () => {
      const id = '123';
      const params = {include: ['offices', 'user-roles']};
      const payload = require('../../test/documents/update-user.json');
      const response = require('../../test/documents/user.json');

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getResourceUrl(User, id) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getResourceUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.update(User, id, payload, params).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getResourceUrl).toHaveBeenCalledWith(User, id);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('PATCH');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('PATCH');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('PATCH');
      expect(apiReq.request.body).toEqual(payload);
      expect(apiReq.request.headers.get('Content-Type')).toEqual(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toEqual(expectedMediaType);
      apiReq.flush(response);
    });

    it('should update single resource with custom path', () => {
      const id = '123';
      const params = {include: ['offices', 'user-roles']};
      const payload = require('../../test/documents/update-user.json');
      const response = require('../../test/documents/user.json');
      const options: Options = {path: "/custom"};

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getCustomUrl(options.path) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getCustomUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.update(User, id, payload, params, options).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getCustomUrl).toHaveBeenCalledWith(options.path);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('PATCH');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('PATCH');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('PATCH');
      expect(apiReq.request.body).toEqual(payload);
      expect(apiReq.request.headers.get('Content-Type')).toEqual(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toEqual(expectedMediaType);
      apiReq.flush(response);
    });

    it('should update all specified resources', () => {
      const payload = require('../../test/documents/update-users.json');
      const params = {include: ["offices", "user-roles"]};
      const response = require('../../test/documents/users.json');

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getResourceListUrl(User) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getResourceListUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.updateAll(User, payload, params).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getResourceListUrl).toHaveBeenCalledWith(User);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('PATCH');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('PATCH');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('PATCH');
      expect(apiReq.request.body).toEqual(payload);
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(response);
    });

    it('should update all specified resources with custom path', () => {
      const payload = require('../../test/documents/update-users.json');
      const params = {include: ["offices", "user-roles"]};
      const response = require('../../test/documents/users.json');
      const options:Options = {path: "/custom"};

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getCustomUrl(options.path) + '?' + parser.parse(params).toString();

      spyOn(builder, 'getCustomUrl').and.callThrough();
      spyOn(parser, 'parse').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.updateAll(User, payload, params, options).subscribe((doc: ApiDocument) => {
        expect(doc).toEqual(response);

        expect(builder.getCustomUrl).toHaveBeenCalledWith(options.path);
        expect(parser.parse).toHaveBeenCalledWith(params);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('PATCH');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('PATCH');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('PATCH');
      expect(apiReq.request.body).toEqual(payload);
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(response);
    });

    it('should delete single resource', () => {
      const id = '123';

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getResourceUrl(User, id);

      spyOn(builder, 'getResourceUrl').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.remove(User, id).subscribe((doc: ApiDocument) => {
        expect(doc).toBeNull();

        expect(builder.getResourceUrl).toHaveBeenCalledWith(User, id);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('DELETE');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('DELETE');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('DELETE');
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(null, {status: 204, statusText: "No content"});
    });

    it('should delete single resource with custom path', () => {
      const id = '123';
      const options: Options = {path: "/custom"};

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getCustomUrl(options.path);

      spyOn(builder, 'getCustomUrl').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.remove(User, id, null, options).subscribe((doc: ApiDocument) => {
        expect(doc).toBeNull();

        expect(builder.getCustomUrl).toHaveBeenCalledWith(options.path);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('DELETE');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('DELETE');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('DELETE');
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(null, {status: 204, statusText: "No content"});
    });

    it('should delete all specified resources', () => {
      const payload = require('../../test/documents/delete-users.json');

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getResourceListUrl(User);

      spyOn(builder, 'getResourceListUrl').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.removeAll(User, payload).subscribe((doc: ApiDocument) => {
        expect(doc).toBeNull();

        expect(builder.getResourceListUrl).toHaveBeenCalledWith(User);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('DELETE');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('DELETE');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('DELETE');
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(null, {status: 204, statusText: 'No content'});
    });

    it('should delete all specified resources with custom options', () => {
      const payload = require('../../test/documents/delete-users.json');
      const options:Options = {path: "/custom"};

      const gReqInterceptor: RequestInterceptor = jasmine.createSpy('TestGlobalReqInterceptor');
      const gRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestGlobalRespInterceptor');
      const rReqInterceptor: RequestInterceptor = jasmine.createSpy('TestResourceReqInterceptor');
      const rRespInterceptor: ResponseInterceptor = jasmine.createSpy('TestResourceRespInterceptor');

      const expectedMediaType = 'application/vnd.api+json';
      const expectedUrl = builder.getCustomUrl(options.path);

      spyOn(builder, 'getCustomUrl').and.callThrough();

      adapter.addRequestInterceptor(gReqInterceptor);
      adapter.addRequestInterceptor(rReqInterceptor, User);
      adapter.addResponseInterceptor(gRespInterceptor);
      adapter.addResponseInterceptor(rRespInterceptor, User);
      adapter.removeAll(User, payload, null, options).subscribe((doc: ApiDocument) => {
        expect(doc).toBeNull();

        expect(builder.getCustomUrl).toHaveBeenCalledWith(options.path);

        expect(gReqInterceptor).toHaveBeenCalledTimes(1);
        expect(rReqInterceptor).toHaveBeenCalledTimes(1);

        expect(gRespInterceptor).toHaveBeenCalledTimes(1);
        const gRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(gRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(gRespInterceptorArgs[1]).toEqual('DELETE');

        expect(rRespInterceptor).toHaveBeenCalledTimes(1);
        const rRespInterceptorArgs = (rRespInterceptor as any).calls.mostRecent().args;
        expect(rRespInterceptorArgs[0] instanceof HttpResponse).toBeTruthy();
        expect(rRespInterceptorArgs[1]).toEqual('DELETE');
      });

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      expect(apiReq.request.method).toBe('DELETE');
      expect(apiReq.request.headers.get('Content-Type')).toBe(expectedMediaType);
      expect(apiReq.request.headers.get('Accept')).toBe(expectedMediaType);
      apiReq.flush(null, {status: 204, statusText: 'No content'});
    });

    it('should handle API errors', () => {
      const response = require('../../test/documents/errors-response.json');

      const gErrorInterceptor = jasmine.createSpy('gErrorInterceptor');
      const rErrorInterceptor = jasmine.createSpy('rErrorInterceptor');

      adapter.addErrorInterceptor(gErrorInterceptor);
      adapter.addErrorInterceptor(rErrorInterceptor, User);
      adapter.get(User, '1').subscribe(
        () => {
          fail('This response should trigger error');
        },
        (error: ApiDocument) => {
          expect(error).toEqual(response);

          expect(gErrorInterceptor).toHaveBeenCalledTimes(1);
          expect(rErrorInterceptor).toHaveBeenCalledTimes(1);
        }
      );

      const expectedUrl = builder.getResourceUrl(User, '1');

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      apiReq.flush(response, {status: 400, statusText: 'Not found'});
    });

    it('should handle general errors', () => {
      const gErrorInterceptor = jasmine.createSpy('gErrorInterceptor');
      const rErrorInterceptor = jasmine.createSpy('rErrorInterceptor');

      adapter.addErrorInterceptor(gErrorInterceptor);
      adapter.addErrorInterceptor(rErrorInterceptor, User);
      adapter.get(User, '1').subscribe(
        () => {
          fail('This response should trigger error');
        },
        (err: ApiDocument) => {
          expect(err.errors.length).toEqual(1);

          const details: ApiError = err.errors[0];
          expect(typeof details.id).toEqual('string');
          expect(details.status).toEqual('500');
          expect(details.title).toEqual('Internal server error');

          expect(gErrorInterceptor).toHaveBeenCalledTimes(1);
          expect(rErrorInterceptor).toHaveBeenCalledTimes(1);
        }
      );

      const expectedUrl = builder.getResourceUrl(User, '1');

      const apiReq = backend.expectOne(req => req.urlWithParams === expectedUrl);
      apiReq.error(null, {status: 500, statusText: 'Internal server error' });
    });
  });
});