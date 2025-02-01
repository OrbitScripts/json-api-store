import {getTestBed, TestBed} from '@angular/core/testing';
import { of, throwError } from "rxjs";

import {JsonApiStore, Options} from './store';
import { JsonApiStoreAdapter } from './store-adapter';
import { JsonApiDocumentSerializer, JsonApiResourceSerializer } from '../serializers';
import { ResourceMetadata } from '../metadata';
import { JsonApiDocument } from '../models';

import { User } from '../../test/models/user.model';

describe('Services', () => {
  describe('JsonApiStore', () => {
    let store: JsonApiStore;
    let serializer: JsonApiDocumentSerializer;
    let adapter: any;

    beforeEach(() => {
      const fakeAdapter = jasmine.createSpyObj(
        'JsonApiStoreAdapter',
        ['get', 'getList', 'create', 'update', 'updateAll', 'remove', 'removeAll']
      );

      TestBed.configureTestingModule({
        providers: [
          JsonApiResourceSerializer,
          JsonApiDocumentSerializer,
          { provide: JsonApiStoreAdapter, useValue: fakeAdapter },
          JsonApiStore
        ]
      });

      const injector = getTestBed();
      store = injector.get(JsonApiStore);
      serializer = injector.get(JsonApiDocumentSerializer);
      adapter = injector.get(JsonApiStoreAdapter);
    });

    it('should return single resource', () => {
      const resType = User;
      const userId = '123';
      const params = { include: ['offices', 'user-roles'] };
      const options: Options = {path: "custom"};
      const response = require('../../test/documents/user.json');

      adapter.get.and.callFake((type: any, id: any, reqParams: any, opts: Options) => {
        expect(type).toEqual(resType);
        expect(id).toEqual(userId);
        expect(reqParams).toEqual(params);
        expect(opts).toEqual(options);

        return of(response);
      });

      spyOn(serializer, 'deserialize').and.callThrough();

      store.get(resType, userId, params, options).subscribe((doc: any) => {
        expect(serializer.deserialize).toHaveBeenCalledTimes(1);

        const call = (serializer.deserialize as any).calls.mostRecent();

        expect(call.args[0]).toEqual(response);
        expect(call.args[1]).toEqual(resType);

        expect(doc).toEqual(call.returnValue);
      });
    });

    it('should return resources list', () => {
      const resType = User;
      const params = {
        include: ['user-role'],
        page: {
          number: 1,
          size: 10
        }
      };
      const options: Options = {path: "/custom"};
      const response = require('../../test/documents/users.json');

      adapter.getList.and.callFake((type: any, reqParams: any, opts: Options) => {
        expect(type).toEqual(resType);
        expect(reqParams).toEqual(params);
        expect(opts).toEqual(options);

        return of(response);
      });

      spyOn(serializer, 'deserialize').and.callThrough();

      store.getList(resType, params, options).subscribe((doc: any) => {
        expect(serializer.deserialize).toHaveBeenCalledTimes(1);

        const call = (serializer.deserialize as any).calls.mostRecent();

        expect(call.args[0]).toEqual(response);
        expect(call.args[1]).toEqual(resType);

        expect(doc).toEqual(call.returnValue);
      });
    });

    it('should create new resource', () => {
      const user = new User();
      user.name = 'Test user';
      user.email = 'test@test.com';

      const params = { include: 'user-roles'};
      const options: Options = {path: "/custom"};
      const response = require('../../test/documents/user.json');

      spyOn(serializer, 'serialize').and.callThrough();

      adapter.create.and.callFake((type: any, payload: any, reqParams: any, opts: Options) => {
        expect(serializer.serialize).toHaveBeenCalledTimes(1);

        const serializerCall = (serializer.serialize as any).calls.mostRecent();
        expect(serializerCall.args[0]).toEqual(user);

        expect(type).toEqual(User);
        expect(payload).toEqual(serializerCall.returnValue);
        expect(reqParams).toEqual(params);
        expect(opts).toEqual(options);

        return of(response);
      });

      spyOn(serializer, 'deserialize').and.callThrough();

      store.save(user, params, options).subscribe((doc: any) => {
        expect(serializer.deserialize).toHaveBeenCalledTimes(1);

        const call = (serializer.deserialize as any).calls.mostRecent();

        expect(call.args[0]).toEqual(response);
        expect(call.args[1]).toEqual(User);

        expect(doc).toEqual(call.returnValue);
      });
    });

    it('should create several resources at once', () => {
      const user1 = new User();
      user1.name = 'First test user';
      user1.email = 'test1@test.com';

      const user2 = new User();
      user2.name = 'Second test user';
      user2.email = 'test2@test.com';

      const newUsers = [user1, user2];

      const params = { include: ['user-roles'] };
      const options: Options = {path: "/custom"};
      const response = require('../../test/documents/users.json');

      spyOn(serializer, 'serialize').and.callThrough();
      adapter.create.and.callFake((type: any, payload: any, reqParams: any, opts: Options) => {
        expect(serializer.serialize).toHaveBeenCalledTimes(1);

        const serializerCall = (serializer.serialize as any).calls.mostRecent();
        expect(serializerCall.args[0]).toEqual(newUsers);

        expect(type).toEqual(User);
        expect(payload).toEqual(serializerCall.returnValue);
        expect(reqParams).toEqual(params);
        expect(opts).toEqual(options);

        return of(response);
      });

      spyOn(serializer, 'deserialize').and.callThrough();
      store.save(newUsers, params, options).subscribe(
        (doc: any) => {
          expect(serializer.deserialize).toHaveBeenCalledTimes(1);

          const call = (serializer.deserialize as any).calls.mostRecent();

          expect(call.args[0]).toEqual(response);
          expect(call.args[1]).toEqual(User);

          expect(doc).toEqual(call.returnValue);
        },
        err => {
          console.error(err);
        }
      );
    });

    it('should update existing resource', () => {
      const user = new User();
      user.id = '123';
      user.name = 'Test User';

      ResourceMetadata.flushMetadata(user);

      user.name = 'New name';

      const params = { include: ['user-roles'] };
      const options: Options = {path: "/custom"};
      const response = require('../../test/documents/user.json');

      spyOn(serializer, 'serialize').and.callThrough();

      adapter.update.and.callFake((type: any, id: any, payload: any, reqParams: any, opts: Options) => {
        expect(serializer.serialize).toHaveBeenCalledTimes(1);

        const serializeCall = (serializer.serialize as any).calls.mostRecent();
        expect(serializeCall.args[0]).toEqual(user);

        expect(type).toEqual(User);
        expect(id).toEqual(user.id);
        expect(payload).toEqual(serializeCall.returnValue);
        expect(reqParams).toEqual(params);
        expect(opts).toEqual(options);

        return of(response);
      });

      spyOn(serializer, 'deserialize').and.callThrough();

      store.save(user, params, options).subscribe((doc: any) => {
        expect(serializer.deserialize).toHaveBeenCalledTimes(1);

        const call = (serializer.deserialize as any).calls.mostRecent();

        expect(call.args[0]).toEqual(response);
        expect(call.args[1]).toEqual(User);

        expect(doc).toEqual(call.returnValue);
      });
    });

    it('should update several existing resources at once', () => {
      const user1 = new User();
      user1.id = '123';
      user1.name = 'First user';

      ResourceMetadata.flushMetadata(user1);
      user1.name = 'New first user name';

      const user2 = new User();
      user2.id = '124';
      user2.name = 'Second user';

      ResourceMetadata.flushMetadata(user2);
      user2.name = 'New second user name';

      const users = [user1, user2];
      const params = { include: ['offices'] };
      const options: Options = {path: "/custom"};
      const response = require('../../test/documents/users.json');

      spyOn(serializer, 'serialize').and.callThrough();

      adapter.updateAll.and.callFake((type: any, payload: any, reqParams: any, opts: Options) => {
        expect(serializer.serialize).toHaveBeenCalledTimes(1);

        const serializerCall = (serializer.serialize as any).calls.mostRecent();
        expect(serializerCall.args[0]).toEqual(users);

        expect(type).toEqual(User);
        expect(payload).toEqual(serializerCall.returnValue);
        expect(reqParams).toEqual(params);
        expect(opts).toEqual(options);

        return of(response);
      });

      spyOn(serializer, 'deserialize').and.callThrough();

      store.save(users, params, options).subscribe((doc: any) => {
        expect(adapter.updateAll).toHaveBeenCalledTimes(1);
        expect(serializer.deserialize).toHaveBeenCalledTimes(1);

        const call = (serializer.deserialize as any).calls.mostRecent();

        expect(call.args[0]).toEqual(response);
        expect(call.args[1]).toEqual(User);

        expect(doc).toEqual(call.returnValue);
      });
    });

    it('should delete specified resource', () => {
      const user = new User();
      user.id = '123';

      const params = { include: ['offices'] };
      const options: Options = {path: "/custom"};

      adapter.remove.and.callFake((type: any, id: any, reqParams: any, opts: Options) => {
        expect(type).toEqual(User);
        expect(id).toEqual(user.id);
        expect(reqParams).toEqual(params);
        expect(opts).toEqual(options);

        return of(null);
      });

      spyOn(serializer, 'deserialize').and.callThrough();

      store.remove(user, params, options).subscribe((doc: any) => {
        expect(adapter.remove).toHaveBeenCalledTimes(1);
        expect(serializer.deserialize).toHaveBeenCalledTimes(1);

        expect(doc).toBeNull();
      });
    });

    it('should delete several specified resources at once', () => {
      const user1 = new User();
      user1.id = '123';

      const user2 = new User();
      user2.id = '124';

      const users = [user1, user2];
      const params = { include: ['offices'] };
      const options: Options = {path: "/custom"};

      spyOn(serializer, 'serializeAsId').and.callThrough();

      adapter.removeAll.and.callFake((type: any, payload: any, reqParams: any, opts: Options) => {
        expect(serializer.serializeAsId).toHaveBeenCalledTimes(1);

        const serializerCall = (serializer.serializeAsId as any).calls.mostRecent();
        expect(serializerCall.args[0]).toEqual(users);

        expect(type).toEqual(User);
        expect(payload).toEqual(serializerCall.returnValue);
        expect(reqParams).toEqual(params);
        expect(opts).toEqual(options);

        return of(null);
      });

      spyOn(serializer, 'deserialize').and.callThrough();

      store.remove(users, params, options).subscribe((doc: any) => {
        expect(adapter.removeAll).toHaveBeenCalledTimes(1);
        expect(serializer.deserialize).toHaveBeenCalledTimes(1);

        expect(doc).toBeNull();
      });
    });

    it('should properly handle errors', () => {
      const response = require('../../test/documents/errors-response.json');

      adapter.get.and.callFake(() => {
        return throwError(response);
      });

      spyOn(serializer, 'deserialize').and.callThrough();

      store.get(User, '123').subscribe(
        () => {
          throw new Error('Store should properly handle errors');
        },
        (error: any) => {
          expect(adapter.get).toHaveBeenCalledTimes(1);
          expect(serializer.deserialize).toHaveBeenCalledTimes(1);

          const call = (serializer.deserialize as any).calls.mostRecent();

          expect(call.args[0]).toEqual(response);
          expect(call.args[1]).toEqual(User);

          expect(error).toEqual(call.returnValue);
        }
      );
    });

    it('should throw error if you try to create and update resources in the same time', () => {
      const oldUser = new User();
      oldUser.id = '123';
      oldUser.name = 'Old user';
      oldUser.email = 'old@test.com';
      ResourceMetadata.flushMetadata(oldUser);
      oldUser.name = 'New name for old user';

      const newUser = new User();
      newUser.name = 'New user';
      newUser.email = 'new@test.com';

      const users = [oldUser, newUser];

      spyOn(serializer, 'deserialize').and.callThrough();

      store.save(users).subscribe(
        () => {
          throw new Error(
            'Store should throw error if you try to create and update resources in the same time'
          );
        },
        (error: any) => {
          expect(serializer.deserialize).toHaveBeenCalledTimes(1);

          const call = (serializer.deserialize as any).calls.mostRecent();

          expect(error).toEqual(call.returnValue);
          expect(error instanceof JsonApiDocument).toBeTruthy();
          expect(error.errors[0].status).toEqual('400');
          expect(error.errors[0].title).toEqual('You cannot create and update resources in the same time');
        }
      );
    });
  });
});
