import { JsonApiParamsParser } from './params-parser';

describe('Services', () => {
  describe('JsonApiParamsParser', () => {
    let parser: JsonApiParamsParser;

    beforeEach(() => {
      parser = new JsonApiParamsParser();
    });

    it('should parse params from string', () => {
      const data = 'include=users,offices&simple=test';

      const params = parser.parse(data);

      expect(params.toString()).toEqual(data);
    });

    it('should parse params from object', () => {
      const data = {
        include: ['users', 'offices'],
        page: {
          number: 1,
          size: 10
        },
        simple: 'test'
      };

      const params = parser.parse(data);

      expect(params.toString()).toEqual('include=users,offices&page%5Bnumber%5D=1&page%5Bsize%5D=10&simple=test');
    });
  });
});