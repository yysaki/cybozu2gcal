import 'source-map-support/register';
import { google, calendar_v3 } from 'googleapis';

import { GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, GOOGLE_API_REFRESH_TOKEN } from '../config';

export const setupCalendar = (): calendar_v3.Calendar => {
  /* const SCOPES = ['https://www.googleapis.com/auth/calendar.events']; */
  const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

  const oauth2client = new google.auth.OAuth2(GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, REDIRECT_URI);
  oauth2client.setCredentials({ refresh_token: GOOGLE_API_REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oauth2client });
  return calendar;
};
