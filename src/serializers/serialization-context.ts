export class SerializationContext {
  private serialized = new Set();

  isSerialized(item: object): boolean {
    return this.serialized.has(item);
  }

  markSerialized(item: object): void {
    this.serialized.add(item);
  }
}
