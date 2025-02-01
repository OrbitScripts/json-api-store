import { JsonApiDocument } from './document';
import { ApiError } from '../contracts';

import { User } from '../../test/models/user.model';

describe("Models", () => {
  describe("JsonApiDocument", () => {

    let doc: JsonApiDocument<User>;

    beforeEach(() => {
      doc = new JsonApiDocument<User>();
    });

    it('should detect errors', () => {
      expect(doc.hasErrors).toBeFalsy();

      const error: ApiError = {
        id: Math.random().toString()
      };

      doc.errors = [error];

      expect(doc.hasErrors).toBeTruthy();
    });
  });
});