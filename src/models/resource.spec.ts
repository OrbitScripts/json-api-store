import { User } from '../../test/models/user.model';
import {Office} from "../../test/models/office.model";
import {ResourceMetadata} from "../metadata";

describe("Models", () => {
  describe("JsonApiResource", () => {

    let user: User;

    beforeEach(() => {
      user = new User();
      user.name = 'test';
      user.email = 'test@test.com';

      user.office = new Office();
      user.office.title = 'Test Office';
      user.office.address = 'Test Address';

      const metadata = ResourceMetadata.getMetadata(user);
      metadata.flush();
    });

    it('should support cloning', () => {
      const clone = user.clone();

      clone.name = 'another';
      user.office.title = 'new office';

      expect(clone).not.toBe(user);
      expect(clone.name).not.toEqual(user.name);
      expect(clone.email).toEqual(user.email);
      expect(clone.office).not.toBe(user.office);
      expect(clone.office.title).not.toEqual(user.office.title);
      expect(clone.office.address).toEqual(user.office.address);
    });
  });
});
