# JSON API STORE

## Описание
Данная библиотека поможет вам сделать работу с вашим [JSON API](http://jsonapi.org/format/) легкой и 
удобной. Библиотека ориентирована на использования в приложениях написанных с использованием 
[Angular](https://angular.io/), но при необходимости может быть достаточно легко адаптирована для 
использования с другими framework'ами.

## Установка
Для установки библиотеки вам необходимо добавить ее в зависимости вашего проекта:
```
npm install @orbitsoft/json-api-store
```

## Работа с библиотекой

### Подключение к приложению

Для начала нам необходимо импортировать модуль ```JsonApiModule``` в основной модуль нашего 
приложения. Модуль ```JsonApiModule``` использует ```HttpModule```, поэтому модуль 
```HttpModule``` должен быть импортирован первым:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { provideJsonApi } from '@orbit/json-api-store';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
  ],
  providers: [provideJsonApi('http://localhost:4200/api')],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
Как видно из примера, при импорте ```JsonApiModule``` в основной модуль вашего приложения
необходимо использовать метод ```provideJsonApi()``` и указать базовый URL вашего JSON API.

При необходимости, ```JsonApiModule``` может быть импортирован и в другие модули вашего приложения.
Однако при этом не нужно использовать метод ```provideJsonApi()```:
```typescript
import { NgModule } from '@angular/core';
import { provideJsonApi } from '@orbit/json-api-store';

import { ContactsComponent } from './contacts.component';

@NgModule({
  declarations: [
    ContactsComponent
  ],
  imports: [
  ],
  providers: [provideJsonApi('http://localhost:4200/api')],
  bootstrap: [ContactsComponent]
})
export class ContactsModule { }
```

### Описание моделей
Для работы с ```JsonApiStore``` необходимо описать модели. Модель - это plain typescript object, 
который представляют сущность предметной области вашего приложения. При этом класс описывающий
модель должен поддерживать интерфейс ```Resource```, т.е. иметь свойство ```id```, в котором будет
храниться строковый уникальный идентификатор ресурса JSON API. Для удобства мы добавили класс
```JsonApiResource```, который вы можете использовать в качестве родительского класса ваших 
моделей.

Для примера опишем модель, которая представляет пользователя приложения:
```typescript
import { JsonApiResource } from '@orbit/json-api-store';
import { Office } from './office.model';
import { UserRole } from './user-role.model';

export class User extends JsonApiResource {
  /**
  * Имя 
  */
  name: string;

  /**
  * Электронный адрес 
  */
  email: string;

  /**
  * Оффис, в котором работает пользователь 
  */
  office: Office;

  /**
  * Список ролей пользователя 
  */
  roles: UserRole[];
}
```

Для того чтобы ```JsonApiStore``` смог работать с нашими моделями, нам необходимо добавить 
специальные декораторы к классу и его свойствам.

В первую очередь к самому классу ```User``` нам необходимо добавить декоратор ```@Model()```.
При этом мы должны указать тип ресурса JSON API, который соответствует нашей модели:
```typescript
import { JsonApiResource, Model } from '@orbit/json-api-store';

@Model({type: 'users'})
export class User extends JsonApiResource {
  
}
```

После этого нам необходимо добавить соответствующие декораторы к свойствам нашего класса.
 
Для свойств, которые соответствуют атрибутам JSON API ресурса, необходимо добавить декоратор
```@Attribute()```:
```typescript
import { JsonApiResource, Model, Attribute } from '@orbit/json-api-store';
import { Office } from './office.model';
import { UserRole } from './user-role.model';

@Model({type: 'users'})
export class User extends JsonApiResource {
  
  @Attribute()
  name: string;

  @Attribute()
  email: string;
}
```

Для свойств, которые соответствуют внешним связям JSON API ресурса, необходимо добавить декоратор
```@Relationship()``` и указать модель, которая соответствует:
```typescript
import { Attribute, JsonApiResource, Model, Relationship } from '@orbit/json-api-store';
import { Office } from './office.model';
import { UserRole } from './user-role.model';

@Model({type: 'users'})
export class User extends JsonApiResource {

  @Relationship({resource: Office})
  office: Office;

  @Relationship({resource: UserRole, isArray: true})
  roles: UserRole[];
}
```
Для свойств, которым соответствует связь "один-ко-многим", нам необходимо выставить значение 
параметра ```isArray``` в ```true```. В нашем примере таким свойством является свойство 
```roles```, поскольку пользователь может иметь сразу несколько ролей.

После того как мы описали модель ```User```, нам также необходимо добавить модели ```Office```
и ```UserRole```:
```typescript
import { Attribute, JsonApiResource, Model } from '@orbit/json-api-store';

@Model({type: 'offices'})
export class Office extends JsonApiResource {

  @Attribute()
  title: string;
}

@Model({type: 'user-roles'})
export class UserRole extends JsonApiResource {

  @Attribute()
  role: string;

  @Attribute()
  status: string;
}

```

### Реализация сервиса для взаимодействия с backend'ом
После того как мы описали модели, используемые в нашем приложении, мы можем использовать
```JsonApiStore``` для отправки запросов нашему backend'у. Обычно все методы работы с каким либо
типом ресурсов группируются в одном сервисе и затем этот сервис используется компонентами 
приложения. 

Давайте реализуем ```UserService```, который позволит нам управлять пользователями нашего
приложения: 
```typescript
import { JsonApiStore } from '@orbit/json-api-store';
import { Injectable } from '@angular/core';

@Injectable()
export class UserService {

  constructor(private store: JsonApiStore) {};
}
```
Используя механизмы dependency injection, предоставляемые Angular, мы внедрили 
```JsonApiStore``` в наш сервис. После этого мы можем реализовывать различные методы нашего
сервиса, которые позволят нам выполнять те или иные действия с нашими пользователя.

Начнем с метода, который позволит получить список пользователей, которые соответствуют заданным 
критериям:
```typescript
import { JsonApiDocument, JsonApiStore } from '@orbit/json-api-store';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { User } from '../models/user.model';

@Injectable()
export class UserService {

  getList(params?: any): Observable<JsonApiDocument<User[]>> {
    return this.store.getList(User, params);
  }

}
```
Для получения списка пользователей мы используем метод ```JsonApiStore.getList()```. Этот метод 
отправит GET-запрос нашему JSON API (```GET http://localhost:4200/api/users```) и вернет 
```JsonApiDocument```, содержащий ответ полученный от сервера.

Далее давайте добавим метод, который позволит нам получить информацию о заданном пользователе:
```typescript
import { JsonApiDocument, JsonApiStore } from '@orbit/json-api-store';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { User } from '../models/user.model';

@Injectable()
export class UserService {

  get(id: string, params?: any): Observable<JsonApiDocument<User>> {
    return this.store.get(User, id, params);
  }

}
```
Для получения информации о конкретном пользователе мы используем метод ```JsonApiStore.get()```.
Этот метод отправит GET-запрос (```GET http://localhost:4200/api/users/123```) и вернет ответ 
сервера в виде объекта ```JsonApiDocument```.

После того как мы реализовали методы, позволяющие получить нам информацию о существующих 
пользователях, давайте добавим метод, который позволит нам создавать новых пользователей и
вносить изменения в существующих:
```typescript
import { JsonApiDocument, JsonApiStore } from '@orbit/json-api-store';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { User } from '../models/user.model';

@Injectable()
export class UserService {

  save(users: User, params?: any): Observable<JsonApiDocument<User>> {
    return this.store.save(users, params);
  }

}
```
Здесь мы используем метод ```JsonApiStore.save()```. Если в качестве параметра
```users``` передан новый пользователь, ```JsonApiStore``` отправит POST-запрос 
(```POST http://localhost:4200/users```). В случае если пользователь уже существует, 
```JsonApiStore``` отправит PATCH-запрос (```PATCH http://localhost:4200/api/users/123```).
В обоих случаях ```JsonApiStore``` вернет ответ сервера в виде объекта ```JsonApiDocument```.

Далее нам осталось реализовать метод, который позволит удалять пользователей:
```typescript
import { JsonApiDocument, JsonApiStore } from '@orbit/json-api-store';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { User } from '../models/user.model';

@Injectable()
export class UserService {

  remove(user: User, params?: any): Observable<JsonApiDocument<User>> {
    return this.store.remove(user, params);
  }
  
}
```
Для удаления записей мы используем метод ```JsonApiStore.remove()```, который отправит
DELETE-запрос (```DELETE http://localhost:4200/api/users/123```) нашему API и вернет ответ
сервера в виде ```JsonApiDocument```


