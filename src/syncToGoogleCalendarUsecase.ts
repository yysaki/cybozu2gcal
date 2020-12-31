import 'source-map-support/register';
import { calendar_v3 } from 'googleapis';

import { GOOGLE_CALENDAR_ID as calendarId } from './config';
import { Event, isUnique } from './entity';

const listEvents = async (calendar: calendar_v3.Calendar, timeMin: string, timeMax: string) => {
  const { data: { items } } = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    maxResults: 250,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return items || [];
}

const buildEvent = (event: Event): calendar_v3.Schema$Event => {
  return {
    summary: event.title,
    description: event.eid,
    start: { dateTime: event.startedAt },
    end: { dateTime: event.endedAt},
  };
}

const insertEvent = async (calendar: calendar_v3.Calendar, event: Event) => {
  const requestBody = buildEvent(event);

  return await calendar.events.insert({
    calendarId,
    requestBody
  });
}

const deleteEvent = async (calendar: calendar_v3.Calendar, { googleId }: Event) => {
  return await calendar.events.delete({
    calendarId,
    eventId: googleId || '',
  });
}

const minMaxISOTime = (events: Event[]) => {
  const unixTimes = events
    .map(e => [e.startedAt, e.endedAt])
    .reduce((array, value) => array.concat(value))
    .map(d => new Date(d).getTime());

  const result: [string, string] = [
    new Date(Math.min(...unixTimes)).toISOString(),
    new Date(Math.max(...unixTimes)).toISOString()
  ]

  return result;
}

const eventFrom = (googleEvent: calendar_v3.Schema$Event): Event => {
  return {
    title: googleEvent.summary || '',
    eid: googleEvent.description || '',
    googleId: googleEvent.id || '',
    startedAt: googleEvent.start?.dateTime || '',
    endedAt: googleEvent.end?.dateTime || '',
  };
}

const isUnique = (lhs: Event, rhs: Event) => {
  return lhs.eid === rhs.eid && lhs.startedAt === rhs.startedAt && lhs.endedAt === rhs.endedAt;
};

const syncEvents = async (calendar: calendar_v3.Calendar, events: Event[], googleEvents: calendar_v3.Schema$Event[]) => {
  const existsEvents = googleEvents.map(eventFrom);
  const insertTargets = events.filter(e1 => existsEvents.every(e2 => !isUnique(e1, e2)));
  const deleteTargets = existsEvents.filter(e1 => events.every(e2 => !isUnique(e1, e2)));

  await Promise.all(insertTargets.map(async event => await insertEvent(calendar, event)));
  await Promise.all(deleteTargets.map(async event => await deleteEvent(calendar, event)));

  return `inserted: ${insertTargets.length}, deleted: ${deleteTargets.length}`;
}

export const syncToGoogleCalendarUsecase = (calendar: calendar_v3.Calendar) => {
  return async (events: Event[]) => {
    const googleEvents = await listEvents(calendar, ...minMaxISOTime(events));

    const result = await syncEvents(calendar, events, googleEvents);
    return result;
  }
}
