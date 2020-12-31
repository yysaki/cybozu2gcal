import 'source-map-support/register';
import { calendar_v3 } from 'googleapis';

import { GOOGLE_CALENDAR_ID as calendarId } from './config';
import { Event, isUnique, minMaxDateFrom } from './entity';

const buildBody = (event: Event): calendar_v3.Schema$Event => {
  return {
    summary: event.title,
    description: event.eid,
    start: { dateTime: event.startedAt },
    end: { dateTime: event.endedAt},
  };
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

const listEvents = async (calendar: calendar_v3.Calendar, timeMin: string, timeMax: string) => {
  const response = await calendar.events.list({ calendarId, timeMin, timeMax, singleEvents: true });

  return response.data.items || [];
}

const insertEvent = async (calendar: calendar_v3.Calendar, event: Event) => {
  return await calendar.events.insert({ calendarId, requestBody: buildBody(event) });
}

const deleteEvent = async (calendar: calendar_v3.Calendar, { googleId }: Event) => {
  return await calendar.events.delete({ calendarId, eventId: googleId || '' });
}

export const syncToGoogleCalendarUsecase = (calendar: calendar_v3.Calendar) => {
  return async (events: Event[]) => {
    const { timeMin, timeMax } = minMaxDateFrom(events);
    const googleEvents = await listEvents(calendar, timeMin.toISOString(), timeMax.toISOString());

    const existEvents = googleEvents.map(eventFrom);
    const insertTargets = events.filter(e1 => existEvents.every(e2 => !isUnique(e1, e2)));
    const deleteTargets = existEvents.filter(e1 => events.every(e2 => !isUnique(e1, e2)));

    await Promise.all(insertTargets.map(async event => await insertEvent(calendar, event)));
    await Promise.all(deleteTargets.map(async event => await deleteEvent(calendar, event)));

    return `inserted: ${insertTargets.length}, deleted: ${deleteTargets.length}`;
  }
}
