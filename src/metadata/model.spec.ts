import { ModelMetadata } from './model';
import { AttributeMetadata } from './attribute';

describe('Metadata', () => {
  describe('Model', () => {
    let metadata: ModelMetadata;

    beforeEach(() => {
      metadata = new ModelMetadata();
    });

    it('should add attributes', () => {
      const attr1 = new AttributeMetadata('test1');
      const attr2 = new AttributeMetadata('test2');

      metadata
        .addAttribute(attr1)
        .addAttribute(attr2);

      expect(metadata.getAttributes()).toEqual([attr1, attr2]);
    });

    it('should return specified attribute', () => {
      const attr = new AttributeMetadata('test');

      metadata.addAttribute(attr);

      expect(metadata.getAttribute('test')).toEqual(attr);
    });
  });
});
