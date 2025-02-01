import { JsonApiResource, Model, Attribute } from '../../src';

import type { User } from './user.model';

@Model({type: 'user-roles'})
export class UserRole extends JsonApiResource {

    @Attribute()
      role: string;

    @Attribute()
      status = 'activation';

    constructor(user?: User, role?: string) {
      super();

      this.role = role;

      if (user && user.id && role) {
        this.id = user.id + '-' + role;
      }
    }
}
