import { Trip } from '@/types';

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function exportTripToIcs(trip: Trip) {
  const now = new Date();
  const baseDate = trip.startDate ? new Date(trip.startDate) : new Date();

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Trip Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${trip.title}`,
  ];

  trip.days.forEach((day) => {
    const dayDate = new Date(baseDate);
    dayDate.setDate(baseDate.getDate() + (day.dayNumber - 1));

    day.activities.forEach((act) => {
      // Parse time if possible, e.g. "09:00 AM"
      let actStart = new Date(dayDate);
      let actEnd = new Date(dayDate);

      const timeMatch = act.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3]?.toUpperCase();

        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        actStart.setHours(hours, minutes, 0, 0);
        actEnd.setHours(hours + 1, minutes + 30, 0, 0);
      } else {
        actStart.setHours(9, 0, 0, 0);
        actEnd.setHours(10, 30, 0, 0);
      }

      const uid = `${act.id || Math.random()}@aitripplanner.app`;

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatIcsDate(now)}`,
        `DTSTART:${formatIcsDate(actStart)}`,
        `DTEND:${formatIcsDate(actEnd)}`,
        `SUMMARY:${act.title}`,
        `DESCRIPTION:${(act.description || '').replace(/\n/g, '\\n')}`,
        `LOCATION:${(act.location || '').replace(/\n/g, '\\n')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${trip.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_itinerary.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
