import { AttributeMetadata } from './attribute';
import { RelationshipMetadata } from './relationship';
import { METADATA_KEY } from '../decorators/model';
import { ResourceType } from '../contracts/models/resource-type';
import { Resource } from '../contracts/models/resource';

export class ModelMetadata {
  public type: string;
  public path: string;
  public discField: string;
  public discMap: Record<string, string>;
  private attributes: AttributeMetadata[] = [];
  private relationships: RelationshipMetadata[] = [];

  public static getClassMetadata<T extends Resource>(modelType: ResourceType<T>): ModelMetadata {
    return (Reflect as any).getOwnMetadata(METADATA_KEY, modelType);
  }

  public static getObjectMetadata<T extends Resource>(object: T|T[]): ModelMetadata {
    if (Array.isArray(object)) {
      object = object[0];
    }

    const modelType = Object.getPrototypeOf(object).constructor;

    return ModelMetadata.getClassMetadata(modelType);
  }

  addAttributes(attributes: AttributeMetadata[]): ModelMetadata {
    attributes.forEach((attribute) => {
      this.addAttribute(attribute);
    });

    return this;
  }

  addAttribute(attribute: AttributeMetadata): ModelMetadata {
    this.attributes.push(attribute);

    return this;
  }

  getAttributes(): AttributeMetadata[] {
    return this.attributes.slice(0);
  }

  getAttribute(name: string): AttributeMetadata {
    return this.attributes.find((attribute) => attribute.property === name);
  }

  addRelationships(relationships: RelationshipMetadata[]): ModelMetadata {
    relationships.forEach((relationship) => {
      this.addRelationship(relationship);
    });

    return this;
  }

  addRelationship(relationship: RelationshipMetadata): ModelMetadata {
    this.relationships.push(relationship);

    return this;
  }

  getRelationships(): RelationshipMetadata[] {
    return this.relationships.slice(0);
  }

  getRelationship(name: string): RelationshipMetadata {
    return this.relationships.find((relationship) => relationship.property === name);
  }
}
