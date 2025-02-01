import { FieldMetadata } from './field';
import { AttributeSerializer } from '../contracts';

export class AttributeMetadata extends FieldMetadata {
  serializer: AttributeSerializer;
}