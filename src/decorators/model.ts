import { ModelConfiguration, ResourceType } from '../contracts';
import { ModelMetadata, Registry } from '../metadata';

export const METADATA_KEY = 'JsonApiResource';
export const METADATA_PROPERTY = '__apiMetadata';

export function Model(config?: ModelConfiguration): ClassDecorator {

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return function (target: Function) {
    if (!(Reflect as any).hasOwnMetadata(METADATA_KEY, target)) {
      (Reflect as any).defineMetadata(METADATA_KEY, new ModelMetadata(), target);
    }

    const metadata: ModelMetadata = (Reflect as any).getOwnMetadata(METADATA_KEY, target);

    const parentTarget = Object.getPrototypeOf(target.prototype).constructor;
    if ((Reflect as any).hasMetadata(METADATA_KEY, parentTarget)) {
      const parentMetadata: ModelMetadata = (Reflect as any).getMetadata(METADATA_KEY, parentTarget);

      metadata.type = parentMetadata.type;
      metadata
        .addAttributes(parentMetadata.getAttributes())
        .addRelationships(parentMetadata.getRelationships());
    }

    if (config) {
      if (config.type) {
        metadata.type = config.type;
      }

      metadata.discField = config.discField;
      metadata.discMap = config.discMap;
      metadata.path = config.path;
    }

    if (!metadata.type) {
      throw Error('JSON API resource type not specified');
    }

    (Reflect as any).defineMetadata(METADATA_KEY, metadata, target);

    const modelId = (config && config.id) ? config.id : target.name;

    Registry.register(modelId, (target as ResourceType<any>));
  };
}
