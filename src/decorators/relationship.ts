import { METADATA_KEY, METADATA_PROPERTY } from './model';
import { ModelMetadata, RelationshipMetadata, ResourceMetadata } from '../metadata';
import { RelationshipConfiguration } from '../contracts';

export function Relationship(config: RelationshipConfiguration): PropertyDecorator {
  return function (target: any, propertyName: string) {
    if ((typeof config.resource === 'object') && !(Reflect as any).hasOwnMetadata(METADATA_KEY, config.resource)) {
      throw new Error('Specified resource doesn\'t have JSON API metadata');
    }

    if (!(Reflect as any).hasOwnMetadata(METADATA_KEY, target.constructor)) {
      (Reflect as any).defineMetadata(METADATA_KEY, new ModelMetadata(), target.constructor);
    }

    const relationship: RelationshipMetadata = new RelationshipMetadata(propertyName, config.field);
    relationship.isArray = config.isArray;
    relationship.resource = config.resource;


    const metadata: ModelMetadata = (Reflect as any).getOwnMetadata(METADATA_KEY, target.constructor);
    metadata.addRelationship(relationship);

    const getter = function() {
      if (!this[METADATA_PROPERTY]) {
        this[METADATA_PROPERTY] = new ResourceMetadata();
      }

      return (this[METADATA_PROPERTY] as ResourceMetadata).getFieldValue(propertyName);
    };

    const setter = function(value: any) {
      if (!this[METADATA_PROPERTY]) {
        this[METADATA_PROPERTY] = new ResourceMetadata();
      }

      (this[METADATA_PROPERTY] as ResourceMetadata).updateField(propertyName, value);
    };

    if (delete target[propertyName]) {
      Object.defineProperty(target, propertyName, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true
      });
    }
  };
}
