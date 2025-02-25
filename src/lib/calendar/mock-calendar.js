// Mock calendar service that simulates calendar events
export class MockCalendarService {
  constructor() {
    // Generate some mock events for the next 30 days
    this.events = this.generateMockEvents();
  }

  generateMockEvents() {
    const events = [];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // Generate 20 random events
    for (let i = 0; i < 20; i++) {
      const eventDate = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );
      
      // Round to nearest hour
      eventDate.setMinutes(0, 0, 0);
      
      const endEventDate = new Date(eventDate);
      endEventDate.setHours(endEventDate.getHours() + 1);

      events.push({
        id: `mock-event-${i}`,
        summary: 'Busy',
        start: { dateTime: eventDate.toISOString() },
        end: { dateTime: endEventDate.toISOString() }
      });
    }

    return events;
  }

  async getEvents(timeMin, timeMax) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return this.events.filter(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      return eventStart >= timeMin && eventEnd <= timeMax;
    });
  }

  async createEvent(event) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const newEvent = {
      id: `mock-event-${this.events.length}`,
      ...event
    };

    this.events.push(newEvent);
    return newEvent;
  }
}
