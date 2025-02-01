import { Attribute, Model } from '../../src/decorators';
import { Shape } from './shape.model';

@Model({id: 'com.test.rectangle'})
export class Rectangle extends Shape {

    @Attribute()
      width: number;

    @Attribute()
      height: number;

    constructor() {
      super();

      this.shapeType = 'rectangle';
    }
}
