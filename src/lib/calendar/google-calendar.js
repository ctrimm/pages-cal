export class GoogleCalendarService {
  async getEvents(timeMin, timeMax) {
    try {
      const response = await fetch(`${process.env.PUBLIC_URL}/availability.json`);
      const data = await response.json();
      
      return data.events.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return eventStart >= timeMin && eventEnd <= timeMax;
      });
    } catch (error) {
      console.error('Error fetching availability:', error);
      return [];
    }
  }

  async createEvent(event) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${process.env.REACT_APP_GITHUB_OWNER}/${process.env.REACT_APP_GITHUB_REPO}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${process.env.REACT_APP_GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            event_type: 'create-event',
            client_payload: event
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      // Return a placeholder since GitHub API doesn't return the event data
      return {
        id: 'pending',
        status: 'scheduled',
        htmlLink: '#'
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }
}
