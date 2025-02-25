import { MockCalendarService } from './mock-calendar';
import { GoogleCalendarService } from './google-calendar';

export function createCalendarService() {
  // Use mock service in development, real service in production
  if (process.env.NODE_ENV === 'development' || !process.env.REACT_APP_GOOGLE_CLIENT_ID) {
    return new MockCalendarService();
  }

  return new GoogleCalendarService(
    process.env.REACT_APP_GOOGLE_CLIENT_ID,
    process.env.REACT_APP_GOOGLE_API_KEY
  );
}

// Singleton instance
let calendarService;

export function getCalendarService() {
  if (!calendarService) {
    calendarService = createCalendarService();
  }
  return calendarService;
}
