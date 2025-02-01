import { ApiResourceId } from './resource-id';

export interface ApiResource {
    id?: string;
    type: string;
    attributes?: Record<string, any>;
    relationships?: Record<string, {data: ApiResourceId|ApiResourceId[]}>;
}