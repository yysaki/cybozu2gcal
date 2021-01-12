import { calendar_v3 } from 'googleapis';
import { Event } from '../../entity';
import { dayjs, tz } from '../../lib';
import { GoogleCalendarRepository } from '../../usecase/cybozu2gcal';
import { CalendarDriver } from './';

const entityEventFrom = ({ start, end, ...rest }: calendar_v3.Schema$Event): Event | undefined => {
  if (rest.description?.indexOf('This event was generated by cybozu2gcal.') !== 0) return;

  const match = rest.description?.match(/UID:([0-9]+)/);
  const id = match?.[1] || '';
  const googleEventId = rest.id || '';
  const title = rest.summary || '';

  if (start?.dateTime && end?.dateTime) {
    const startedAt = dayjs(start.dateTime);
    const endedAt = dayjs(end.dateTime);
    return { id, type: 'dateTime', googleEventId, title, startedAt, endedAt };
  } else {
    const startedAt = tz(start?.date || '');
    const endedAt = tz(end?.date || '');
    return { id, type: 'date', googleEventId, title, startedAt, endedAt };
  }
};

const googleCalendarEventFrom = ({ id, type, title, startedAt, endedAt }: Event): calendar_v3.Schema$Event => {
  const summary = title;
  const description = `This event was generated by cybozu2gcal.

UID:${id}`;
  if (type === 'dateTime') {
    const start = { dateTime: startedAt.format() };
    const end = { dateTime: endedAt.format() };
    return { summary, description, start, end };
  } else {
    const start = { date: startedAt.format('YYYY-MM-DD') };
    const end = { date: endedAt.format('YYYY-MM-DD') };
    return { summary, description, start, end };
  }
};

export const createGoogleCalendarRepository = (calendarDriver: CalendarDriver): GoogleCalendarRepository => {
  const driver = calendarDriver();
  return {
    list: async (timeMin, timeMax) => {
      const events = await driver.list(timeMin, timeMax);

      return events.map(entityEventFrom).filter<Event>((e): e is Event => !!e);
    },
    insert: async (event: Event) => {
      await driver.insert(googleCalendarEventFrom(event));
    },
    delete: async ({ googleEventId }: Event) => {
      await driver.delete(googleEventId || '');
    },
  };
};
