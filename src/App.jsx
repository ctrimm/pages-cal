import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCalendarService } from "@/lib/calendar";

const Home = () => {
  const [config, setConfig] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/config.json`)
      .then(response => response.json())
      .then(data => setConfig(data))
      .catch(error => console.error('Error loading config:', error));
  }, []);

  if (!config) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <img 
          src={config.profile.imageUrl} 
          alt={config.profile.name}
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h1 className="text-4xl font-bold">{config.profile.name}</h1>
          <p className="text-muted-foreground">Timezone: {config.profile.timezone}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {config.meetingTypes.map((type) => (
          <Card key={type.id} className="p-6">
            <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
            <p className="text-muted-foreground mb-2">{type.duration} minutes</p>
            <p className="mb-4">{type.description}</p>
            <Button 
              className="w-full"
              onClick={() => navigate(`/calendar/${type.id}`)}
            >
              Select
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Calendar = () => {
  const [config, setConfig] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [busySlots, setBusySlots] = useState([]);
  const { meetingTypeId } = useParams();
  const navigate = useNavigate();
  
  const calendarService = useMemo(() => getCalendarService(), []);
  const meetingType = useMemo(() => 
    config?.meetingTypes?.find(type => type.id === meetingTypeId),
    [config, meetingTypeId]
  );

  // Load config
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/config.json`)
      .then(response => response.json())
      .then(data => setConfig(data))
      .catch(error => console.error('Error loading config:', error));
  }, []);

  // Fetch busy slots for the selected date
  useEffect(() => {
    if (!config || !meetingType) return;
    const fetchBusySlots = async () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      try {
        const events = await calendarService.getEvents(startOfDay, endOfDay);
        setBusySlots(events);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        setBusySlots([]);
      }
    };

    fetchBusySlots();
  }, [selectedDate, calendarService]);

  const generateTimeSlots = useMemo(() => {
    return (date) => {
      if (!config || !meetingType) return [];
      
      const slots = [];
      const { start, end } = config.availability.workingHours;
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);
      
      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMinute, 0);
      
      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0);

      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + meetingType.duration * 60000);
        
        // Check if slot conflicts with any busy slots
        const isConflicting = busySlots.some(event => {
          const eventStart = new Date(event.start.dateTime);
          const eventEnd = new Date(event.end.dateTime);
          return (
            (currentTime >= eventStart && currentTime < eventEnd) ||
            (slotEnd > eventStart && slotEnd <= eventEnd) ||
            (currentTime <= eventStart && slotEnd >= eventEnd)
          );
        });

        if (!isConflicting) {
          slots.push(new Date(currentTime));
        }
        
        currentTime = slotEnd;
      }

      return slots;
    };
  }, [config, meetingType, busySlots]);

  const timeSlots = useMemo(
    () => generateTimeSlots(selectedDate),
    [selectedDate, busySlots, generateTimeSlots]
  );

  if (!config || !meetingType) return <div>Loading...</div>;

  const handleConfirm = async () => {
    if (!selectedTime) return;

    const event = {
      summary: `${meetingType.title} with ${config.profile.name}`,
      description: meetingType.description,
      start: {
        dateTime: selectedTime.toISOString(),
      },
      end: {
        dateTime: new Date(selectedTime.getTime() + meetingType.duration * 60000).toISOString(),
      },
    };

    try {
      await calendarService.createEvent(event);
      navigate('/');
    } catch (error) {
      console.error('Error creating event:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{meetingType.title}</h1>
        <p className="text-muted-foreground">{meetingType.duration} minutes</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Date</h2>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium p-2">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isAvailable = config.availability.workingDays.includes(date.getDay());
              
              return (
                <Button
                  key={i}
                  variant={isSelected ? "default" : isToday ? "outline" : "ghost"}
                  className={`${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isAvailable}
                  onClick={() => setSelectedDate(date)}
                >
                  {date.getDate()}
                </Button>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Time</h2>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((time, i) => (
              <Button
                key={i}
                variant={selectedTime?.getTime() === time.getTime() ? "default" : "outline"}
                onClick={() => setSelectedTime(time)}
              >
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {selectedTime && (
        <div className="mt-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Confirm Your Meeting</h2>
            <p className="mb-2">
              {meetingType.title} with {config.profile.name}
            </p>
            <p className="text-muted-foreground mb-4">
              {selectedTime.toLocaleString([], {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <Button className="w-full" onClick={handleConfirm}>Confirm Meeting</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <div className={cn("min-h-screen bg-background font-sans antialiased")}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar/:meetingTypeId" element={<Calendar />} />
      </Routes>
    </div>
  );
}

export default App;
