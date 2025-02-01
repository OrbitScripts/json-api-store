/**
 * Configuration object for {@link Model} decorator
 */
export interface ModelConfiguration {
    /**
     * Unique model ID. If not specified Model name will be used.
     */
    id?: string;

    /**
     * Resource type
     */
    type?: string;

    /**
     * Name of the property that store value for discriminator
     */
    discField?: string;

    /**
     * Discriminator map
     */
    discMap?: Record<string, string>;

    /**
     * Path to resources on server if it doesn't match to resource type
     */
    path?: string;
}
