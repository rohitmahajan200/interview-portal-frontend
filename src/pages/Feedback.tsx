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

  // Format date helper function
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading feedbacks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <MessageSquareText className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Feedbacks</h3>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
          Candidate Feedbacks
        </h2>
        <div className="text-center py-12">
          <MessageSquareText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
            No Feedbacks Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            There are no candidate feedbacks available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
        Candidate Feedbacks ({feedbacks.length})
      </h2>
      <div className="space-y-6">
        {feedbacks.map((fb) => (
          <div
            key={fb._id}
            className="border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-5 hover:shadow-md transition duration-200"
          >
            {/* Header with feedback type and date */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
              <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 capitalize w-fit">
                {fb.feedback_type.replace(/_/g, " ").replace(/-/g, " ")}
              </span>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(fb.createdAt)}</span>
              </div>
            </div>

            {/* Feedback provider information */}
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 gap-2 mb-3">
              <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Feedback by:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{fb.feedback_provider.name}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">
                  {fb.feedback_provider.role}
                </span>
              </div>
            </div>
            {/* Feedback content */}
            <div className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed border-l-4 border-blue-200 dark:border-blue-700 pl-4 italic">
              <MessageSquareText className="w-4 h-4 inline text-blue-400 dark:text-blue-300 mr-1 mb-1" />
              {fb.content.split('\n').map((line, index) => (
                <div key={index} className={index > 0 ? 'mt-2' : ''}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feedback;
