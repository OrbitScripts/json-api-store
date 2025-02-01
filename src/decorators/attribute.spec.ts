import { Model, METADATA_KEY } from './model';
import { Attribute } from './attribute';
import { AttributeMetadata, ModelMetadata } from '../metadata';
import { AttributeSerializer } from '../contracts/serializers';

describe('Decorators', () => {
  describe("Attribute", () => {

    class DumbSerializer implements AttributeSerializer {
      serialize(value: any): any {
        return value;
      }

      deserialize(value: any): any {
        return value;
      }
    }

        @Model({type: 'test'})
    class TestResource {

            @Attribute({field: 'firstName', serializer: new DumbSerializer()})
              name: string;


            @Attribute()
              test: boolean;
        }

        it('should add attribute metadata', () => {
          const metadata: ModelMetadata = (Reflect as any).getOwnMetadata(METADATA_KEY, TestResource);
          const attrMetadata: AttributeMetadata = metadata.getAttribute('name');

          expect(attrMetadata instanceof AttributeMetadata).toBeTruthy();
          expect(attrMetadata.property).toEqual('name');
          expect(attrMetadata.field).toEqual('firstName');
          expect(attrMetadata.serializer instanceof DumbSerializer).toBeTruthy();
        });

        it('should remove original property', () => {
          const instance = new TestResource();

          expect(Object.prototype.hasOwnProperty.call(instance, 'name')).toBeFalsy();
        });

        it('should provide getter and setter for original property', () => {
          const instance: any = new TestResource();
          instance.name = 'Test';
          instance.test = true;

          expect(instance.name).toEqual('Test');
          expect(instance.test).toEqual(true);
        });
  });
});
