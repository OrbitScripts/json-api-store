import { ResourceMetadata } from './resource';
import { Model, Attribute } from '../decorators';

describe('Metadata', () => {
  describe('Resource', () => {
        @Model({type: 'simple'})
    class SimpleResource {

            @Attribute()
              title: string;
        }

        let metadata: ResourceMetadata;

        beforeEach(() => {
          metadata = new ResourceMetadata();
        });

        it('should provide proper initial state', () => {
          expect(metadata.isNew).toBeTruthy();
          expect(metadata.hasChanges).toBeFalsy();
        });

        it('should detect changes for simple values', () => {
          metadata.updateField('strField', 'test');
          metadata.updateField('numField', 100);
          metadata.updateField('boolField', false);

          expect(metadata.hasChanges).toBeTruthy();
          expect(metadata.isChanged('strField')).toBeTruthy();
          expect(metadata.isChanged('numField')).toBeTruthy();
          expect(metadata.isChanged('boolField')).toBeTruthy();
          expect(metadata.isChanged('another')).toBeFalsy();
        });

        it('should have proper state after flush', () => {
          const resource = new SimpleResource();
          resource.title = 'test';

          metadata.updateField('simple', 'test');
          metadata.updateField('array', [1, 2, 3]);
          metadata.updateField('resource', resource);

          expect(metadata.hasChanges).toBeTruthy();
          expect(metadata.isChanged('simple')).toBeTruthy();
          expect(metadata.isChanged('array')).toBeTruthy();
          expect(metadata.isChanged('resource')).toBeTruthy();

          metadata.flush();

          expect(metadata.hasChanges).toBeFalsy();
          expect(metadata.isChanged('simple')).toBeFalsy();
          expect(metadata.isChanged('array')).toBeFalsy();
          expect(metadata.isChanged('resource')).toBeFalsy();
        });

        it('should properly detect changes in simple arrays', () => {
          metadata.updateField('test', [1, 2, 3]);
          metadata.flush();

          expect(metadata.isChanged('test')).toBeFalsy();

          metadata.updateField('test', [1, 2, 3, 4]);
          expect(metadata.isChanged('test')).toBeTruthy();

          metadata.updateField('test', [3, 1, 2]);
          expect(metadata.isChanged('test')).toBeFalsy();
        });

        it('should properly detect changes in inner resource', () => {
          const resource = new SimpleResource();
          resource.title = 'test';

          const anotherResource = new SimpleResource();
          resource.title = 'test2';

          metadata.updateField('resource', resource);
          metadata.flush();

          expect(metadata.isChanged('resource')).toBeFalsy();

          metadata.updateField('resource', anotherResource);
          expect(metadata.isChanged('resource')).toBeTruthy();

          metadata.updateField('resource', resource);
          expect(metadata.isChanged('resource')).toBeFalsy();

          resource.title = 'changed';
          expect(metadata.isChanged('resource')).toBeTruthy();
        });

        it('should properly detect changes in resources array', () => {
          const first = new SimpleResource();
          first.title = 'first';

          const second = new SimpleResource();
          second.title = 'second';

          metadata.updateField('resources', [first, second]);
          metadata.flush();

          expect(metadata.isChanged('resources')).toBeFalsy();

          metadata.updateField('resources', [second, first]);
          expect(metadata.isChanged('resources')).toBeFalsy();

          first.title = 'changed';
          expect(metadata.isChanged('resources')).toBeTruthy();
        });
  });
});