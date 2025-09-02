import React from "react";
import { AlarmClock, Info, FileText } from "lucide-react";
import { useDispatch } from "react-redux";
import { setCurrentView } from "@/features/Candidate/view/viewSlice.js";

interface Event {
  id: string;
  type: "Assessment" | "Interview" | "Document";
  title: string;
  date: string;
}

interface Props {
  events: Event[];
  candidateId?: string;
  onOpenDocumentForm?: () => void;
}

export const EventNotificationCard: React.FC<Props> = ({ 
  events, 
  candidateId = "", 
  onOpenDocumentForm 
}) => {
  const dispatch = useDispatch();

  const handleEventClick = (event: Event) => {
    if (event.type === "Assessment") {
      dispatch(setCurrentView("assessments"));
    } else if (event.type === "Document") {
      if (onOpenDocumentForm) {
        onOpenDocumentForm();
      }
    } else if (event.type === "Interview") {
      dispatch(setCurrentView("interviews"));
    }
  };

  return (
    <div className="p-4 w-full">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
        <AlarmClock size={20} /> Upcoming Events
      </h2>

      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event.id}
              className={`border border-border rounded-lg p-4 shadow-sm cursor-pointer transition ${
                event.type === "Document" 
                  ? "bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800" 
                  : "bg-card hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => handleEventClick(event)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  {event.type === "Document" && <FileText className="h-4 w-4 text-green-600" />}
                  <span className={`font-semibold ${
                    event.type === "Document" ? "text-green-700 dark:text-green-300" : "text-primary"
                  }`}>
                    {event.type}
                  </span>{" "}
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
