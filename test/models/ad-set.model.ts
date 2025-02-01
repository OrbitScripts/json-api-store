import { Model, Attribute, Relationship, JsonApiResource } from '../../src';
import { AdSetPosition } from './ad-set-position.model';

@Model({type: 'ad-sets', id: 'com.test.AdSet'})
export class AdSet extends JsonApiResource {

    @Attribute()
      name: string;

    @Relationship({resource: 'com.test.AdPosition', isArray: true})
      positions: AdSetPosition[];
}
