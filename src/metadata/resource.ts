import { METADATA_KEY, METADATA_PROPERTY } from '../decorators/model';

export class ResourceMetadata {
  private _isNew = true;
  private _flushed = false;
  private _fields: Record<string, {value: any, initial: any}> = {};

  public static getMetadata(resource: Record<string, any>): ResourceMetadata {
    if (!resource[METADATA_PROPERTY]) {
      return null;
    }

    return resource[METADATA_PROPERTY];
  }

  public static flushMetadata(resource: Record<string, any>) {
    if (!resource[METADATA_PROPERTY]) {
      return;
    }

    (resource[METADATA_PROPERTY] as ResourceMetadata).flush();
  }

  get isNew(): boolean {
    return this._isNew;
  }

  get hasChanges(): boolean {
    for (const field in this._fields) {
      if (this.isChanged(field)) {
        return true;
      }
    }

    return false;
  }

  getFieldValue(field: string): any {
    if (!this._fields[field]) {
      return undefined;
    }

    return this._fields[field].value;
  }

  updateField(field: string, value: any): ResourceMetadata {
    if (!this._fields[field]) {
      this._fields[field] = {value: value, initial: null};
    } else {
      this._fields[field].value = value;
    }

    this._flushed = false;

    return this;
  }

  isChanged(field: string): boolean {
    if (!this._fields[field]) {
      return false;
    }

    const data = this._fields[field];

    if ((data.initial instanceof Array) && (data.value instanceof Array)) {
      return ResourceMetadata.compareArrays(data.initial, data.value);
    }

    if (data.value === data.initial) {
      if (ResourceMetadata.isResource(data.value)) {
        return ResourceMetadata.isResourceChanged(data.value);
      }

      return false;
    }

    return true;
  }

  // @ts-ignore
  flush(isNew = false, recursive = true): ResourceMetadata {
    if (this._flushed) {
      return this;
    }

    this._isNew = false;
    Object.keys(this._fields).forEach((field) => {
      if (this._fields[field].value instanceof Array) {
        this._fields[field].initial = this._fields[field].value.slice(0);
      } else {
        this._fields[field].initial = this._fields[field].value;
      }

      if (ResourceMetadata.isResource(this._fields[field].initial) && recursive) {
        ResourceMetadata.flushMetadata(this._fields[field].initial);
      } else if (this._fields[field].initial instanceof Array) {
        this._fields[field].initial.forEach((cur: any) => {
          if (ResourceMetadata.isResource(cur) && recursive) {
            ResourceMetadata.flushMetadata(cur);
          }
        });
      }
    });
    this._flushed = true;

    return this;
  }

  private static compareArrays(initial: any[], current: any[]): boolean {
    if (initial.length !== current.length) {
      return true;
    }

    let hasChanges = false;
    current.forEach((value) => {
      if ((initial.indexOf(value) === -1) ||
                (ResourceMetadata.isResource(value) && ResourceMetadata.isResourceChanged(value))
      ) {
        hasChanges = true;
      }
    });

    return hasChanges;
  }

  private static isResource(value: any): boolean {
    if ((!(value instanceof Object)) ||
            (!(Reflect as any).hasOwnMetadata(METADATA_KEY, Object.getPrototypeOf(value).constructor))
    ) {
      return false;
    }

    return true;
  }

  private static isResourceChanged(value: Record<string, any>): boolean {
    if (!value[METADATA_PROPERTY]) {
      return false;
    }

    return (value[METADATA_PROPERTY] as ResourceMetadata).hasChanges;
  }
}
