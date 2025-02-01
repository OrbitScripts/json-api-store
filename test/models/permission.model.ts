import { JsonApiResource, Model, Attribute } from '../../src';

@Model({type: 'permissions'})
export class Permission extends JsonApiResource {

    @Attribute()
      name: string;
}