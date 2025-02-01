import { JsonApiResource, Model, Relationship } from '../../src';

import { User } from './user.model';
import { Administrator } from './administrator.model';
import { Office } from './office.model';
import { Permission } from './permission.model';

@Model({type: 'corrupted'})
export class CorruptedResource extends JsonApiResource {

    @Relationship({resource: User})
      owner: User;

    @Relationship({resource: Administrator})
      admin: Administrator;

    @Relationship({resource: Office, isArray: true})
      offices: Office[];

    @Relationship({resource: Permission, isArray: true})
      permissions: Permission[];
}