import React from "react";
import { AlarmClock, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Event = {
  id: string;
  type: "Assessment" | "Interview";
  title: string;
  date: string;
};

type Props = {
  events: Event[];
};

const EventNotificationCard: React.FC<Props> = ({ events }) => {
  const navigate = useNavigate();

  const handleNavigate = (event: Event) => {
    if (event.type === "Assessment") {
      navigate("/candidate/assessment");
    } else if (event.type === "Interview") {
      navigate("/candidate/interview");
    }
  };

  return (
    <div className="bg-muted/50 rounded-xl p-4 w-full max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlarmClock size={20} /> Upcoming Events
      </h2>

      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event.id}
              className="border border-border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition"
              onClick={() => handleNavigate(event)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">
                  <span className="text-primary font-semibold">{event.type}</span> - {event.title}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDateTime(event.date)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <Info size={18} className="text-gray-400" />
          No events scheduled
        </div>
      )}
    </div>
  );
};

function formatDateTime(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return new Date(dateString).toLocaleString("en-GB", options);
}

export default EventNotificationCard;
