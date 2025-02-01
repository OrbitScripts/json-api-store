import { Resource } from './resource';

export type ResourceType<T extends Resource> = new() => T;