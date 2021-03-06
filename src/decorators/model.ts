import { ModelConfiguration } from '../contracts';
import { ModelMetadata } from '../metadata';

export const METADATA_KEY = 'JsonApiResource';
export const METADATA_PROPERTY = '__apiMetadata';

export function Model(config?: ModelConfiguration): ClassDecorator {
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
            metadata.path = config.path;
        }

        if (!metadata.type) {
            throw Error('JSON API resource type not specified');
        }

        (Reflect as any).defineMetadata(METADATA_KEY, metadata, target);
    };
}