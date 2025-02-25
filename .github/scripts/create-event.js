const { google } = require('googleapis');

// Setup Google Calendar client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

async function createEvent() {
  try {
    const eventData = JSON.parse(process.env.EVENT_DATA);

    // Create the event in Google Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: eventData.start.timeZone || 'UTC'
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: eventData.end.timeZone || 'UTC'
        }
      }
    });

    console.log('Event created successfully:', response.data.htmlLink);
  } catch (error) {
    console.error('Error creating event:', error);
    process.exit(1);
  }
}

createEvent();
