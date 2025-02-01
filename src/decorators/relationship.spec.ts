import { Model, METADATA_KEY } from './model';
import { Attribute } from './attribute';
import { Relationship } from './relationship';
import { RelationshipMetadata, ModelMetadata } from '../metadata';

describe('Decorators', () => {
  describe('Relationship', () => {
        @Model({type: 'menu-items'})
    class MenuItem {

            @Attribute()
              title: string;
        }

        @Model({type: 'users'})
        class User {

            @Attribute()
              name: string;
        }

        @Model({type: 'menus'})
        class Menu {

            @Relationship({resource: User})
              creator: User;

            @Relationship({field: 'menuItems', resource: MenuItem, isArray: true})
              items: MenuItem[];
        }

        it('should provide relationship metadata', () => {
          const metadata: ModelMetadata = (Reflect as any).getOwnMetadata(METADATA_KEY, Menu);

          const creatorMetadata = metadata.getRelationship('creator');
          expect(creatorMetadata instanceof RelationshipMetadata).toBeTruthy();
          expect(creatorMetadata.property).toEqual('creator');
          expect(creatorMetadata.field).toBeUndefined();
          expect(creatorMetadata.isArray).toBeFalsy();
          expect(creatorMetadata.resource).toEqual(User);

          const itemsMetadata = metadata.getRelationship('items');
          expect(itemsMetadata instanceof RelationshipMetadata).toBeTruthy();
          expect(itemsMetadata.property).toEqual('items');
          expect(itemsMetadata.field).toEqual('menuItems');
          expect(itemsMetadata.isArray).toBeTruthy();
          expect(itemsMetadata.resource).toEqual(MenuItem);
        });

        it('should remove original property', () => {
          const menu = new Menu();

          expect(Object.prototype.hasOwnProperty.call(menu, 'creator')).toBeFalsy();
          expect(Object.prototype.hasOwnProperty.call(menu, 'items')).toBeFalsy();
        });

        it('should provide getter and setter for original property', () => {
          const menu = new Menu();

          expect(menu.creator).toBeUndefined();
          expect(menu.items).toBeUndefined();

          const user = new User();
          menu.creator = user;

          expect(menu.creator).toEqual(user);

          const menuItems = [new MenuItem(), new MenuItem()];
          menu.items = menuItems;

          expect(menu.items).toEqual(menuItems);
        });
  });
});
