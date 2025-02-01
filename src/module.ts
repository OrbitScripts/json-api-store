import {EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";

import {JSON_API_BASE_URL, JsonApiParamsParser, JsonApiStore, JsonApiStoreAdapter, JsonApiUrlBuilder} from './services';
import {JsonApiDocumentSerializer, JsonApiResourceSerializer} from './serializers';

export function provideJsonApi(apiUrl: string): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptorsFromDi()),
    { provide: JSON_API_BASE_URL, useValue: apiUrl },
    JsonApiResourceSerializer,
    JsonApiDocumentSerializer,
    JsonApiUrlBuilder,
    JsonApiParamsParser,
    JsonApiStoreAdapter,
    JsonApiStore,
  ]);
}
