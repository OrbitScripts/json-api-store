import { JsonApiResource, Model, Relationship, Attribute } from '../../src';

import { User } from './user.model';
import { Office } from './office.model';

@Model({type: 'custom-fields-resources'})
export class CustomFieldsResource extends JsonApiResource {
    @Attribute({field: 'name'})
      title: string;

    @Relationship({resource: User, field: 'user'})
      customer: User;

    @Relationship({resource: Office, isArray: true})
      offices: Office[];
}