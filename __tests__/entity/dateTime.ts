import { DateTime } from '/src/entity/dateTime';

describe('DateTime', () => {
  const subject = (date: string) => new DateTime(date).format();

  describe('with date', () => {
    it('returns datetime with zone', () => {
      expect(subject('2021-04-19')).toBe('2021-04-19T00:00:00+09:00');
    });
  });

  describe('with datetime without zone', () => {
    it('returns datetime with zone', () => {
      expect(subject('2021-04-19T14:30:00')).toBe('2021-04-19T14:30:00+09:00');
    });
  });

  describe('with datetime with +00:00', () => {
    it('returns datetime with zone', () => {
      expect(subject('2021-04-19T14:30:00+00:00')).toBe('2021-04-19T23:30:00+09:00');
    });
  });

  describe('with datetime with +09:00', () => {
    it('returns datetime with zone', () => {
      expect(subject('2021-04-19T14:30:00+09:00')).toBe('2021-04-19T14:30:00+09:00');
    });
  });
});
