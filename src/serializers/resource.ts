import { Injectable } from '@angular/core';

import { ModelMetadata, ResourceMetadata, AttributeMetadata, RelationshipMetadata, Registry } from '../metadata';
import { Resource, ResourceType, ApiResource, ApiResourceId, ApiRelationship } from '../contracts';
import { DeserializationContext } from './deserialization-context';
import { SerializationContext } from './serialization-context';

@Injectable()
export class JsonApiResourceSerializer {

  serialize<T extends Resource>(resource: T, context: SerializationContext): ApiResource {
    const metadata = ModelMetadata.getObjectMetadata(resource);

    const payload: ApiResource = {
      type: metadata.type
    };

    if (resource.id) {
      payload.id = resource.id;
    }

    if (context.isSerialized(resource)) {
      return payload;
    }

    context.markSerialized(resource);

    const attributes = this.serializeAttributes(resource, metadata);
    if (attributes) {
      payload.attributes = attributes;
    }

    const relationships = this.serializeRelationships(resource, metadata, context);
    if (relationships) {
      payload.relationships = relationships;
    }

    return payload;
  }

  serializeAsId<T extends Resource>(resource: T, metadata: ModelMetadata): ApiResourceId {
    return (resource) ? {id: resource.id, type: metadata.type} : null;
  }

  deserialize<T extends Resource>(
    data: ApiResource,
    modelType: ResourceType<T>,
    context: DeserializationContext
  ): T {
    const metadata = ModelMetadata.getClassMetadata(modelType);

    if (metadata.discField) {
      const discVal = this.deserializeAttribute(data.attributes, metadata.getAttribute(metadata.discField));
      if (discVal && metadata.discMap && metadata.discMap[discVal]) {
        return this.deserialize(data, Registry.get(metadata.discMap[discVal]), context);
      }
    }

    const resource = new modelType();
    resource.id = data.id;

    context.addResource(metadata.type, resource);

    if (data.attributes && data.attributes instanceof Object) {
      this.deserializeAttributes(resource, data.attributes, metadata);
    }

    if (data.relationships && data.relationships instanceof Object) {
      this.deserializeRelationships(resource, data.relationships, metadata, context);
    }

    ResourceMetadata.flushMetadata(resource);


    return resource;
  }

  private serializeAttributes(resource: Resource, metadata: ModelMetadata): Record<string, any> {
    const instMetadata = ResourceMetadata.getMetadata(resource);
    if (!instMetadata) {
      return null;
    }

    let count = 0;
    const attributes: Record<string, any> = {};


    metadata.getAttributes().forEach((attrMetadata: AttributeMetadata) => {
      if (metadata.discField !== attrMetadata.field && !instMetadata.isChanged(attrMetadata.property)) {
        return;
      }

      let value = instMetadata.getFieldValue(attrMetadata.property);
      if (attrMetadata.serializer) {
        value = attrMetadata.serializer.serialize(value);
      } else if (typeof value === 'undefined') {
        value = null;
      }

      const field = (attrMetadata.field) ? attrMetadata.field : attrMetadata.property;

      attributes[field] = value;

      count++;
    });

    return (count > 0) ? attributes : null;
  }

  private serializeRelationships(
    resource: Resource,
    metadata: ModelMetadata,
    context: SerializationContext
  ): any {
    let count = 0;
    const relationships: Record<string, ApiRelationship> = {};

    const instMetadata = ResourceMetadata.getMetadata(resource);

    metadata.getRelationships().forEach((relMetadata: RelationshipMetadata) => {
      const relationship = this.serializeRelationship(relMetadata, instMetadata, context);
      if (!relationship) {
        return;
      }

      const field = (relMetadata.field) ? relMetadata.field : relMetadata.property;

      relationships[field] = relationship;

      count++;
    });

    return (count > 0) ? relationships : null;
  }

  private serializeRelationship(
    relMeta: RelationshipMetadata,
    instMeta: ResourceMetadata,
    context: SerializationContext
  ): ApiRelationship {

    if ((instMeta) && (false === instMeta.isNew) && (false === instMeta.isChanged(relMeta.property))) {
      return null;
    }

    const value = instMeta.getFieldValue(relMeta.property);
    const res = (typeof relMeta.resource === 'string') ? Registry.get(relMeta.resource) : relMeta.resource;
    const metadata = ModelMetadata.getClassMetadata(res);

    if (relMeta.isArray) {
      return this.serializeHasMany(value, metadata, context);
    }

    return this.serializeHasOne(value, metadata, context);
  }

  private serializeHasMany(
    value: any[],
    metadata: ModelMetadata,
    context: SerializationContext
  ): ApiRelationship {
    const relationship: ApiRelationship = {data: []};

    if (!value) {
      return relationship;
    }

    value.forEach((item) => {
      (relationship.data as any[]).push(this.serializeRelationshipItem(item, metadata, context));
    });

    return relationship;
  }

  private serializeHasOne(
    value: any,
    metadata: ModelMetadata,
    context: SerializationContext
  ): ApiRelationship {
    const relationship: ApiRelationship = {data: null};

    if (!value) {
      return relationship;
    }

    relationship.data = this.serializeRelationshipItem(value, metadata, context);

    return relationship;
  }

  private serializeRelationshipItem(
    item: Resource,
    metadata: ModelMetadata,
    context: SerializationContext
  ): ApiResource|ApiResourceId {
    const instMeta = ResourceMetadata.getMetadata(item);

    if ((!instMeta) ||
            (false === instMeta.hasChanges && false === instMeta.isNew) ||
            context.isSerialized(item)
    ) {
      return this.serializeAsId(item, metadata);
    }

    return this.serialize(item, context);
  }

  private deserializeAttributes(resource: any, data: any, metadata: ModelMetadata) {
    metadata.getAttributes().forEach((attrMeta: AttributeMetadata) => {
      const field = (attrMeta.field) ? attrMeta.field : attrMeta.property;
      if (!(field in data)) {
        return;
      }

      resource[attrMeta.property] = (attrMeta.serializer) ? attrMeta.serializer.deserialize(data[field]) : data[field];
    });
  }

  private deserializeAttribute(data: any, metadata: AttributeMetadata): any {
    const field = (metadata.field) ? metadata.field : metadata.property;
    if (!data || !(field in data)) {
      return;
    }

    return (metadata.serializer) ? metadata.serializer.deserialize(data[field]) : data[field];
  }

  private deserializeRelationships(
    resource: any,
    data: any,
    metadata: ModelMetadata,
    context: DeserializationContext
  ) {
    metadata.getRelationships().forEach((relMeta: RelationshipMetadata) => {
      const field = (relMeta.field) ? relMeta.field : relMeta.property;
      if (!data[field]) {
        return;
      }

      let parsedValue: Resource|Resource[];
      const res = (typeof relMeta.resource === 'string') ? Registry.get(relMeta.resource) : relMeta.resource;
      if (relMeta.isArray) {
        parsedValue = this.deserializeRelationshipItems(data[field].data, res, context);
      } else {
        parsedValue = this.deserializeRelationshipItem(data[field].data, res, context);
      }

      resource[relMeta.property] = parsedValue;
    });
  }

  private deserializeRelationshipItems<T extends Resource>(
    value: ApiResourceId[],
    modelType: ResourceType<T>,
    context: DeserializationContext
  ): T[] {
    const parsed: T[] = [];

    if (!Array.isArray(value)) {
      return parsed;
    }

    value.forEach((item: ApiResourceId) => {
      const parsedItem = this.deserializeRelationshipItem(item, modelType, context);
      if (!parsedItem) {
        return;
      }

      parsed.push(parsedItem);
    });

    return parsed;
  }

  private deserializeRelationshipItem<T extends Resource>(
    data: ApiResourceId,
    modelType: ResourceType<T>,
    context: DeserializationContext
  ) {
    if (!data || (!data.type) || (!data.id)) {
      return null;
    }

    if (context.hasResource(data.type, data.id)) {
      return context.getResource(data.type, data.id);
    }

    if (context.hasLinkedData(data.type, data.id)) {
      this.deserialize(context.getLinkedData(data.type, data.id), modelType, context);
    } else {
      this.deserialize(data, modelType, context);
    }

    if (!context.hasResource(data.type, data.id)) {
      throw new Error(`Context doesn't contain resource with type '${data.type}' and ID '${data.id}'`);
    }

    return context.getResource(data.type, data.id);
  }
}
