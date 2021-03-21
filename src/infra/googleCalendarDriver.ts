import { google, calendar_v3 } from 'googleapis';
import { GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, GOOGLE_API_REFRESH_TOKEN, GOOGLE_CALENDAR_ID } from '../config';
import { ICalendarDriver } from '../repository';

const calendarId = GOOGLE_CALENDAR_ID;

export class GoogleCalendarDriver implements ICalendarDriver {
  private calendar: calendar_v3.Calendar;

  constructor() {
    /* const SCOPES = ['https://www.googleapis.com/auth/calendar.events']; */
    const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

    const oAuth2Client = new google.auth.OAuth2(GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, REDIRECT_URI);
    oAuth2Client.setCredentials({ refresh_token: GOOGLE_API_REFRESH_TOKEN });

    this.calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  }

  list = async (timeMin: string, timeMax: string): Promise<calendar_v3.Schema$Event[]> => {
    const response = await this.calendar.events.list({ calendarId, timeMin, timeMax, singleEvents: true });

    return response.data.items || [];
  };

  insert = async (event: calendar_v3.Schema$Event): Promise<void> => {
    await this.calendar.events.insert({ calendarId, requestBody: event });
  };

  delete = async (eventId: string): Promise<void> => {
    await this.calendar.events.delete({ calendarId, eventId });
  };
}
