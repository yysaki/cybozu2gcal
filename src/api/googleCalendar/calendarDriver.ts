import { google, calendar_v3 } from 'googleapis';
import { GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, GOOGLE_API_REFRESH_TOKEN, GOOGLE_CALENDAR_ID } from '../../config';

export type CalendarDriver = () => {
  list(timeMin: string, timeMax: string): Promise<calendar_v3.Schema$Event[]>;
  insert(event: calendar_v3.Schema$Event): Promise<void>;
  delete(eventId: string): Promise<void>;
};

export const calendarDriver: CalendarDriver = () => {
  /* const SCOPES = ['https://www.googleapis.com/auth/calendar.events']; */
  const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

  const oAuth2Client = new google.auth.OAuth2(GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, REDIRECT_URI);
  oAuth2Client.setCredentials({ refresh_token: GOOGLE_API_REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  const calendarId = GOOGLE_CALENDAR_ID;
  return {
    list: async (timeMin, timeMax) => {
      const response = await calendar.events.list({ calendarId, timeMin, timeMax, singleEvents: true });

      return response.data.items || [];
    },
    insert: async (event) => {
      await calendar.events.insert({ calendarId, requestBody: event });
    },
    delete: async (eventId) => {
      await calendar.events.delete({ calendarId, eventId });
    },
  };
};
