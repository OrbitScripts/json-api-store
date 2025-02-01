import { Attribute, Model } from '../../src/decorators';
import { JsonApiResource } from '../../src/models';

@Model({
  id: 'com.test.shape',
  type: 'shapes',
  discField: 'shapeType',
  discMap: {
    'rectangle': 'com.test.rectangle',
    'circle': 'com.test.circle'
  }
})
export class Shape extends JsonApiResource {

    @Attribute()
      shapeType: string;
}
