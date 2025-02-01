import { FieldMetadata } from './field';
import { ResourceType } from '../contracts/models/resource-type';

export class RelationshipMetadata extends FieldMetadata {
  isArray = false;
  resource: ResourceType<any> | string;
}
