import 'source-map-support/register';
import { google, calendar_v3 } from 'googleapis';

import { GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, GOOGLE_API_REFRESH_TOKEN, GOOGLE_CALENDAR_ID } from '../config';
import { Event } from '../entity';
import { GoogleCalendarRepository } from '../usecases';

export const authGoogleApi = (): GoogleCalendarRepository => {
  /* const SCOPES = ['https://www.googleapis.com/auth/calendar.events']; */
  const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

  const oauth2client = new google.auth.OAuth2(GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, REDIRECT_URI);
  oauth2client.setCredentials({ refresh_token: GOOGLE_API_REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oauth2client });
  return new Repository(calendar);
};

const buildBody = (event: Event): calendar_v3.Schema$Event => {
  return {
    summary: event.title,
    description: event.eid,
    start: { dateTime: event.startedAt },
    end: { dateTime: event.endedAt },
  };
};

const eventFrom = (googleEvent: calendar_v3.Schema$Event): Event => {
  return {
    title: googleEvent.summary || '',
    eid: googleEvent.description || '',
    googleId: googleEvent.id || '',
    startedAt: googleEvent.start?.dateTime || '',
    endedAt: googleEvent.end?.dateTime || '',
  };
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

  async delete({ googleId }: Event) {
    await this.#calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: googleId || '',
    });
  }
}
