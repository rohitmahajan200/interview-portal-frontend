import React from "react";
import {
  MessageSquareText,
  Tags,
} from "lucide-react"; // Optional icon library

const feedbacks = [
  {
    candidate: "64f8b7e65fcb3e001f356a80",
    feedback_provider: "64f8b8b35fcb3e001f356a88",
    feedback_type: "post-interview",
    content:
      "The candidate demonstrated strong analytical thinking and problem-solving skills. Very confident with backend systems.",
    stage: "technical_interview",
  },
  {
    candidate: "64f8b7e65fcb3e001f356a81",
    feedback_provider: "64f8b8b35fcb3e001f356a89",
    feedback_type: "assessment",
    content:
      "The assessment was completed accurately and ahead of time. Good understanding of core concepts.",
    stage: "assessment",
  },
  {
    candidate: "64f8b7e65fcb3e001f356a82",
    feedback_provider: "64f8b8b35fcb3e001f356a90",
    feedback_type: "general",
    content:
      "Positive attitude and excellent communication. Strong cultural fit for the team.",
    stage: "HR_interview",
  },
  {
    candidate: "64f8b7e65fcb3e001f356a83",
    feedback_provider: "64f8b8b35fcb3e001f356a91",
    feedback_type: "post-interview",
    content:
      "Candidate handled the pressure well in the final round. Demonstrated leadership and decision-making skills.",
    stage: "final_interview",
  },
];

const Feedback = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
        Candidate Feedbacks
      </h2>
      <div className="space-y-6">
        {feedbacks.map((fb, index) => (
          <div
            key={index}
            className="border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-5 hover:shadow-md transition duration-200"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 capitalize w-fit">
                {fb.feedback_type.replace("-", " ")}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 gap-2 mb-2">
              <Tags className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Stage:</span>
              <span className="capitalize">{fb.stage.replace("_", " ")}</span>
            </div>

            <div className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed border-l-4 border-blue-200 dark:border-blue-700 pl-4 italic">
              <MessageSquareText className="w-4 h-4 inline text-blue-400 dark:text-blue-300 mr-1 mb-1" />
              {fb.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feedback;
