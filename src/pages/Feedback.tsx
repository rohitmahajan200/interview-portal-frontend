import React, { useState, useEffect } from "react";
import {
  MessageSquareText,
  User,
  Calendar,
} from "lucide-react";
import api from "@/lib/api";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await api.get("/candidates/feedback");
        
        if (response.data.success) {
          setFeedbacks(response.data.data);
          setError(null);
        } else {
          throw new Error(response.data.message || "Failed to fetch feedbacks");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching feedbacks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 w-full h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading feedbacks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 w-full h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <MessageSquareText className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-2">Error Loading Feedbacks</h3>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Feedbacks</h2>
        </div>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <MessageSquareText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-medium mb-1">No Feedbacks Found</h3>
            <p className="text-sm text-muted-foreground">
              There are no candidate feedbacks available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Feedbacks</h2>
        <span className="text-sm text-muted-foreground">
          {feedbacks.length} total
        </span>
      </div>

      {/* Compact Feedback List */}
      <div 
        className="overflow-y-auto border rounded-lg bg-background"
        style={{
          height: 'calc(100vh - 200px)',
          minHeight: '400px',
          scrollbarGutter: 'stable'
        }}
      >
        <div className="p-3 space-y-2">
          {feedbacks.map((fb) => (
            <div
              key={fb._id}
              className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
            >
              {/* Compact Header Row */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary capitalize truncate">
                  {fb.feedback_type.replace(/_/g, " ").replace(/-/g, " ")}
                </span>
                <div className="flex items-center text-xs text-muted-foreground gap-1 shrink-0">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(fb.createdAt)}</span>
                </div>
              </div>

              {/* Provider Info Row */}
              <div className="flex items-center gap-2 mb-2 text-sm">
                <User className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{fb.feedback_provider.name}</span>
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground shrink-0">
                  {fb.feedback_provider.role}
                </span>
              </div>

              {/* Compact Feedback Content */}
              <div className="text-sm leading-relaxed border-l-2 border-primary/20 pl-3">
                <MessageSquareText className="w-3 h-3 inline text-primary mr-1 mb-0.5" />
                <span className="text-muted-foreground">
                  {fb.content.split('\n').map((line, index) => (
                    <span key={index} className={index > 0 ? 'block mt-1' : ''}>
                      {line}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feedback;
