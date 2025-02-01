import { JsonApiResource, Model, Attribute } from '../../src';

@Model({type: 'offices', path: '/buildings'})
export class Office extends JsonApiResource {

    @Attribute()
      title: string;

    @Attribute()
      address: string;
}