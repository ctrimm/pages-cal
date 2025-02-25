const fs = require('fs');
const path = require('path');
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

async function getBusyTimes() {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  try {
    // Get busy times from freebusy query
    const freeBusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: thirtyDaysFromNow.toISOString(),
        items: [{ id: 'primary' }],
      },
    });

    // Get all events (to include details like title)
    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busySlots = freeBusyResponse.data.calendars.primary.busy;
    const events = eventsResponse.data.items.map(event => ({
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      summary: event.summary || 'Busy',
    }));

    // Write to public directory
    const outputPath = path.join(process.cwd(), 'public', 'availability.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      lastUpdated: new Date().toISOString(),
      busySlots,
      events: events.map(event => ({
        start: event.start,
        end: event.end,
        summary: event.summary === 'Busy' ? 'Busy' : 'Unavailable', // Don't expose actual event titles
      })),
    }, null, 2));

    console.log('Calendar availability synced successfully');
  } catch (error) {
    console.error('Error syncing calendar:', error);
    process.exit(1);
  }
}

getBusyTimes();
