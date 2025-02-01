import { inject, TestBed } from '@angular/core/testing';

import { JSON_API_BASE_URL, JsonApiUrlBuilder } from './url-builder';

import { User } from '../../test/models/user.model';
import { Office } from '../../test/models/office.model';

describe('Services', () => {
  describe('JsonApiUrlBuilder', () => {
    let baseUrl: string;
    let builder: JsonApiUrlBuilder;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: JSON_API_BASE_URL, useValue: 'http://localhost/api/v1'},
          JsonApiUrlBuilder
        ]
      });
    });

    beforeEach(inject(
      [JSON_API_BASE_URL, JsonApiUrlBuilder],
      (_baseUrl: string, _builder: JsonApiUrlBuilder) => {
        baseUrl=  _baseUrl;
        builder = _builder;
      }
    ));

    it('should build URL for resource list', () => {
      const url = builder.getResourceListUrl(User);

      expect(url).toEqual(baseUrl + '/users');
    });

    it('should build URL for single resource', () => {
      const url = builder.getResourceUrl(User, '123');

      expect(url).toEqual(baseUrl + '/users/123');
    });

    it('should build custom URL', () => {
      const url = builder.getCustomUrl("/custom");

      expect(url).toEqual(baseUrl + '/custom');
    });

    it('should use path from resource metadata', () => {
      const url = builder.getResourceUrl(Office, '123');
      const listUrl = builder.getResourceListUrl(Office);

      expect(url).toEqual(baseUrl + '/buildings/123');
      expect(listUrl).toEqual(baseUrl + '/buildings');
    });
  });
});