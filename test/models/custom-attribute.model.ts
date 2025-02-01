import { JsonApiResource, Model, Attribute, AttributeSerializer } from '../../src';

export class NameSerializer implements AttributeSerializer {
  serialize(value: any): any {
    return value.toLowerCase();
  }

  deserialize(value: any): any {
    return value.toUpperCase();
  }
}

@Model({type: 'custom-attributes'})
export class CustomAttributeResource extends JsonApiResource {

    @Attribute({serializer: new NameSerializer()})
      name: string;
}