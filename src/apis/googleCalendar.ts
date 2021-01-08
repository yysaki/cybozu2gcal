import 'source-map-support/register';
import { google, calendar_v3 } from 'googleapis';

import { GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, GOOGLE_API_REFRESH_TOKEN, GOOGLE_CALENDAR_ID } from '../config';
import { Event } from '../entity';
import { dayjs } from '../lib';
import { GoogleCalendarRepository } from '../usecases';

export const authGoogleApi = (): GoogleCalendarRepository => {
  /* const SCOPES = ['https://www.googleapis.com/auth/calendar.events']; */
  const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

  const oauth2client = new google.auth.OAuth2(GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, REDIRECT_URI);
  oauth2client.setCredentials({ refresh_token: GOOGLE_API_REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oauth2client });
  return new Repository(calendar);
};

const buildBody = ({ id, type, title, startedAt, endedAt }: Event): calendar_v3.Schema$Event => {
  const summary = title;
  const description = id;
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

const eventFrom = ({ start, end, ...rest }: calendar_v3.Schema$Event): Event => {
  const id = rest.description || '';
  const googleEventId = rest.id || '';
  const title = rest.summary || '';

  if (start?.dateTime && end?.dateTime) {
    const startedAt = dayjs(start.dateTime);
    const endedAt = dayjs(end.dateTime);
    return { id, type: 'dateTime', googleEventId, title, startedAt, endedAt };
  } else {
    const startedAt = dayjs(start?.date || '');
    const endedAt = dayjs(end?.date || '');
    return { id, type: 'date', googleEventId, title, startedAt, endedAt };
  }
};

class Repository implements GoogleCalendarRepository {
  #calendar: calendar_v3.Calendar;

  constructor(calendar: calendar_v3.Calendar) {
    this.#calendar = calendar;
  }

  async list(timeMin: string, timeMax: string) {
    const response = await this.#calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
    });

    const items = response.data.items || [];
    return items.map(eventFrom);
  }

  async insert(event: Event) {
    await this.#calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      requestBody: buildBody(event),
    });
  }

  async delete({ googleEventId }: Event) {
    await this.#calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: googleEventId || '',
    });
  }
}
