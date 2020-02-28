import { Shape } from './shape.model';
import { Attribute, Model } from '../../src/decorators';

@Model()
export class Circle extends Shape {

    @Attribute()
    radius: number;

    constructor() {
        super();

        this.shapeType = 'circle';
    }
}
