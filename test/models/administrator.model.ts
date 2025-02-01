import { Model, Attribute, Relationship } from '../../src';

import { User } from './user.model';
import { Permission } from './permission.model';

@Model()
export class Administrator extends User {

    @Attribute({field: 'public'})
      isPublic: boolean;

    @Relationship({resource: Permission, isArray: true})
      permissions: Permission[] = [];
}