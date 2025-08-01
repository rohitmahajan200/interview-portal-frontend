import React from "react";
import { AlarmClock, Info } from "lucide-react";
import { useDispatch } from "react-redux";
import { setCurrentView } from "@/features/view/viewSlice";

interface Event {
  id: string;
  type: "Assessment" | "Interview";
  title: string;
  date: string;
}

interface Props {
  events: Event[];
}

export const EventNotificationCard: React.FC<Props> = ({ events }) => {
  const dispatch = useDispatch();

  const handleEventClick = (type: Event["type"]) => {
    if (type === "Assessment") {
      dispatch(setCurrentView("assessments"));
    } else if (type === "Interview") {
      dispatch(setCurrentView("interviews"));
    }
  };

  return (
    <div className="bg-muted/50 rounded-xl p-4 w-full max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
        <AlarmClock size={20} /> Upcoming Events
      </h2>

      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event.id}
              className="border border-border rounded-lg p-4 bg-card shadow-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition"
              onClick={() => handleEventClick(event.type)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">
                  <span className="text-primary font-semibold">{event.type}</span>{" "}
                  - {event.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(event.date)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <Info size={18} className="text-muted-foreground" />
          No events scheduled
        </div>
      )}
    </div>
  );
};

function formatDateTime(dateString: string) {
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
