import { JsonApiResourceSerializer } from './resource';
import { JsonApiDocumentSerializer } from './document';
import { User } from '../../test/models/user.model';
import { ApiDocument } from '../contracts/api/document';
import { JsonApiDocument } from '../models/document';
import { DeserializationContext } from './deserialization-context';
import { ApiResource } from '../contracts/api/resource';
import { Rectangle } from '../../test/models/rectangle.model';
import { Circle } from '../../test/models/circle.model';
import { Shape } from '../../test/models/shape.model';
import { AdPosition } from '../../test/models/ad-position.model';

describe('JsonApiDocumentSerializer', () => {

  let resSerializer: JsonApiResourceSerializer;
  let docSerializer: JsonApiDocumentSerializer;

  beforeEach(() => {
    resSerializer = new JsonApiResourceSerializer();
    docSerializer = new JsonApiDocumentSerializer(resSerializer);
  });

  it('should serialize single resource', () => {
    const user = new User();
    user.email = 'test@test.com';
    user.name = 'Test user';

    const expected = require('../../test/documents/create-user.json');

    const doc = docSerializer.serialize(user);

    expect(doc).toEqual(expected);
  });

  it('should serialize array of resources', () => {
    const user1 = new User();
    user1.email = 'test1@test.com';
    user1.name = 'Test user 1';

    const user2 = new User();
    user2.email = 'test2@test.com';
    user2.name = 'Test user 2';

    const expected = require('../../test/documents/create-users.json');

    const doc = docSerializer.serialize([user1, user2]);

    expect(doc).toEqual(expected);
  });

  it('should serialize array of resources that have discriminator', () => {
    const rectangle = new Rectangle();
    rectangle.id = 'rectangle1';
    rectangle.width = 100;
    rectangle.height = 80;

    const circle = new Circle();
    circle.id = 'circle1';
    circle.radius = 50;

    const expDoc = require('../../test/documents/shapes.json');

    const doc = docSerializer.serialize([rectangle, circle]);

    expect(doc).toEqual(expDoc);
  });

  it('should deserialize response with single resource', () => {
    const data: ApiDocument = require('../../test/documents/user.json');
    const user = new User();

    // @ts-ignore
    spyOn(resSerializer, 'deserialize').and.callFake((item: any, resType: any, context: any) => {
      expect(item).toEqual(data.data);
      expect(resType).toEqual(User);
      expect(context instanceof DeserializationContext).toBeTruthy();

      return user;
    });

    const doc = docSerializer.deserialize(data, User);

    expect(resSerializer.deserialize).toHaveBeenCalled();

    expect(doc instanceof JsonApiDocument).toBeTruthy();
    expect(doc.data).toEqual(user);
  });

  it('should deserialize response with several resources', () => {
    const data: ApiDocument = require('../../test/documents/users.json');
    const user1 = new User();
    const user2 = new User();

    let pass = 0;

    // @ts-ignore
    spyOn(resSerializer, 'deserialize').and.callFake((item: any, resType: any, context: any) => {
      pass++;

      const responseData: ApiResource[] = data.data as ApiResource[];
      const expectedItem: ApiResource = (1 === pass) ? responseData[0] : responseData[1];
      expect(item).toEqual(expectedItem);

      expect(resType).toEqual(User);
      expect(context instanceof DeserializationContext).toBeTruthy();

      return (1 === pass) ? user1 : user2;
    });

    const doc = docSerializer.deserialize(data, User);

    expect(resSerializer.deserialize).toHaveBeenCalledTimes(2);

    expect(doc instanceof JsonApiDocument).toBeTruthy();

    const docData: User[] = doc.data as User[];
    expect(Array.isArray(docData)).toBeTruthy();
    expect(docData[0]).toEqual(user1);
    expect(docData[1]).toEqual(user2);

    expect(doc.meta).toEqual(data.meta);
  });

  it('should deserialize response with several resources and discriminator', () => {
    const data: any = require('../../test/documents/shapes.json');

    const doc = docSerializer.deserialize(data, Shape);

    expect(doc instanceof JsonApiDocument).toBeTruthy();

    const docData: any[] = doc.data as Shape[];
    expect(Array.isArray(docData)).toBeTruthy();
    expect(docData.length).toEqual(2);

    expect(docData[0] instanceof Rectangle).toBeTruthy();
    expect(docData[0].id).toEqual(data.data[0].id);
    expect(docData[0].shapeType).toEqual(data.data[0].attributes.shapeType);
    expect(docData[0].width).toEqual(data.data[0].attributes.width);
    expect(docData[0].height).toEqual(data.data[0].attributes.height);


    expect(docData[1] instanceof Circle).toBeTruthy();
    expect(docData[1].id).toEqual(data.data[1].id);
    expect(docData[1].shapeType).toEqual(data.data[1].attributes.shapeType);
    expect(docData[1].radius).toEqual(data.data[1].attributes.radius);
  });

  it('should deserialize response with errors', () => {
    spyOn(resSerializer, 'deserialize');

    const data: ApiDocument = require('../../test/documents/errors-response.json');

    const doc = docSerializer.deserialize(data, User);

    expect((resSerializer.deserialize as any).calls.count()).toEqual(0);
    expect(doc instanceof JsonApiDocument).toBeTruthy();
    expect(doc.errors).toEqual(data.errors);
  });

  it('should deserialize response with cross-links', () => {
    const docData: any = require('../../test/documents/ad-position.json');

    const doc = docSerializer.deserialize(docData, AdPosition);

    const adPosition: AdPosition = doc.data as AdPosition;
    expect(adPosition).toBeDefined();
    expect(adPosition.id).toEqual(docData.data.id);
    expect(adPosition.status).toEqual(docData.data.attributes.status);
    expect(adPosition.weight).toEqual(docData.data.attributes.weight);
    expect(adPosition.position).toEqual(docData.data.attributes.position);
    expect(adPosition.description).toEqual(docData.data.attributes.description);
    expect(adPosition.code).toEqual(docData.data.attributes.code);

    const adSet = adPosition.adSet;
    expect(adSet).toBeDefined();
    expect(adSet.id).toEqual(docData.included[0].id);
    expect(adSet.name).toEqual(docData.included[0].attributes.name);
    expect(adSet.positions).toBeDefined();
    expect(Array.isArray(adSet.positions));
    expect(adSet.positions.length).toEqual(1);
    expect(adSet.positions[0]).toBe(adPosition);
  });
});
