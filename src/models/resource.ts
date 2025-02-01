import { Resource } from '../contracts';
import {ModelMetadata, ResourceMetadata} from "../metadata";

export class JsonApiResource implements Resource {

  /**
     * Resource ID
     */
  id: string;

  /**
     * Returns deep clone of object
     */
  clone(): this {
    const modelType = Object.getPrototypeOf(this).constructor;
    const clone = new modelType;

    clone.id = this.id;
    const modelMetadata = ModelMetadata.getObjectMetadata(this);
    if (!modelMetadata) {
      return clone;
    }

    modelMetadata.getAttributes().forEach(attr => {
      // @ts-ignore
      clone[attr.property] = this[attr.property];
    });

    modelMetadata.getRelationships().forEach(rel => {
      if (rel.isArray) {
        // @ts-ignore
        clone[rel.property] = this.cloneRelationshipArray(this[rel.property]);
      } else {
        // @ts-ignore
        clone[rel.property] = this.cloneRelationship(this[rel.property]);
      }
    });

    const objMetadata = ResourceMetadata.getMetadata(this);
    const cloneMetadata = ResourceMetadata.getMetadata(clone);

    if (objMetadata && cloneMetadata) {
      cloneMetadata.flush(objMetadata.isNew, false);
    }

    return clone;
  }

  private cloneRelationship(rel?: JsonApiResource): JsonApiResource | null | undefined {
    if (typeof rel === 'undefined') {
      return undefined;
    } else if (!rel) {
      return null;
    }

    return rel.clone();
  }

  private cloneRelationshipArray(rel?: JsonApiResource[]): JsonApiResource[] | null | undefined {
    if (Array.isArray(rel)) {
      return rel.map(item => item.clone());
    } else if (typeof rel === 'undefined') {
      return undefined;
    }

    return null;
  }
}
