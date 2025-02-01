import { Attribute, JsonApiResource, Model, Relationship } from '../../src';
import { AdPositionSet } from './ad-position-set.model';

@Model({type: 'ad-positions', id: 'com.test.AdPosition'})
export class AdPosition extends JsonApiResource {

    @Attribute()
      position: number;

    @Attribute()
      weight: number;

    @Attribute()
      code: string;

    @Attribute()
      description: string;

    @Attribute()
      status: string;

    @Relationship({resource: 'com.test.AdSet'})
    // @ts-ignore
      adSet: AdPositionSet;
}
