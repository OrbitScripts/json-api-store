import { ResourceType } from '../contracts/models';

export class Registry {
  private static modelsMap: Record<string, ResourceType<any>> = {};

  public static register(id: string, model: ResourceType<any>): void {
    Registry.modelsMap[id] = model;
  }

  public static get(id: string): ResourceType<any> {
    if (!Registry.modelsMap[id]) {
      throw new Error(`Model with ID "${id}" not registered `);
    }

    return Registry.modelsMap[id];
  }
}
