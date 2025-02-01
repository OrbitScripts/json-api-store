import { JsonApiResource, Model, Relationship } from '../../src';

import { User } from './user.model';

@Model({type: 'posts'})
export class Post extends JsonApiResource {

    @Relationship({resource: User})
      author: User;

    @Relationship({resource: User})
      moderator: User;
}