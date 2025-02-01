import { Resource, ApiError } from '../contracts';

/**
 * Object that represent response from JSON API
 */
export class JsonApiDocument<T extends Resource|Resource[]> {

  /**
     * Document primary data that contains resources returned by JSON API server
     */
  data?: T;

  /**
     * List of errors returns from JSON API server
     */
  errors?: ApiError[];

  /**
     * Meta object that contains non-standard meta-information
     */
  meta?: any;

  /**
     * Boolean flag that show that document contains errors
     */
  get hasErrors(): boolean {
    return (Array.isArray(this.errors) && this.errors.length > 0);
  }
}