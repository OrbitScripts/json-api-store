import { Injectable } from '@angular/core';

import { JsonApiResourceSerializer } from './resource';
import { Resource, ResourceType, ApiDocument, ApiResource } from '../contracts';
import { ModelMetadata } from '../metadata';
import { JsonApiDocument } from '../models';
import { DeserializationContext } from './deserialization-context';
import { SerializationContext } from './serialization-context';

@Injectable()
export class JsonApiDocumentSerializer {

  constructor(private resSerializer: JsonApiResourceSerializer) {};

  serialize<T extends Resource>(resources: T|T[]): ApiDocument {
    const doc: ApiDocument = {};
    const context = new SerializationContext();

    if (Array.isArray(resources)) {
      doc.data = [];

      resources.forEach((resource: T) => {
        (doc.data as ApiResource[]).push(this.resSerializer.serialize(resource,context));
      });
    } else {
      doc.data = this.resSerializer.serialize(resources, context);
    }

    return doc;
  }

  serializeAsId<T extends Resource>(resources: T|T[]): ApiDocument {
    const doc: ApiDocument = {};

    const metadata = ModelMetadata.getObjectMetadata(resources);
    if (Array.isArray(resources)) {
      doc.data = [];

      resources.forEach((resource: T) => {
        (doc.data as ApiResource[]).push(this.resSerializer.serializeAsId(resource, metadata));
      });
    } else {
      doc.data = this.resSerializer.serializeAsId(resources, metadata);
    }

    return doc;
  }

  deserialize<T extends Resource>(data: ApiDocument, resType: ResourceType<T>): JsonApiDocument<T|T[]> {
    if (data == null) {
      return null;
    }

    let doc: JsonApiDocument<T|T[]>;
    if (data.data && Array.isArray(data.data)) {
      doc = new JsonApiDocument() as JsonApiDocument<T[]>;
    } else {
      doc = new JsonApiDocument() as JsonApiDocument<T>;
    }

    if (data.data) {
      const context = new DeserializationContext(data.included);

      if (Array.isArray(data.data)) {
        doc.data = [];
        data.data.forEach((item: ApiResource) => {
          (doc.data as T[]).push(this.resSerializer.deserialize(item, resType, context));
        });
      } else {
        doc.data = this.resSerializer.deserialize(data.data, resType, context);
      }
    } else if (data.errors) {
      doc.errors = data.errors;
    }

    doc.meta = data.meta;

    return doc;
  }
}
