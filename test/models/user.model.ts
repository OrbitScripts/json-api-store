import { JsonApiResource, Model, Relationship, Attribute } from '../../src';

import { UserRole } from './user-role.model';
import { Office } from './office.model';

@Model({type: 'users'})
export class User extends JsonApiResource {

    @Attribute()
      email: string;

    @Attribute()
      name: string;

    @Relationship({resource: Office})
      office: Office = null;

    @Relationship({resource: UserRole, isArray: true})
      roles: UserRole[] = [];
}