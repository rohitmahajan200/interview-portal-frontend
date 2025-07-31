import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Interview {
  _id: string;
  interview_type: string;
  round: number;
  status: string;
  scheduled_at: string;
  joining_link: string;
  interviewers: { name: string; email: string }[];
}

const Interviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.get('/candidates/interviews');
        setInterviews(response.data.data);
      } catch (error) {
        console.error('Error fetching interviews:', error);
      }
    }
    loadData();
  }, []);

  const getDisplayStatus = (interview: Interview) => {
    const now = new Date();
    const scheduledDate = new Date(interview.scheduled_at);

    if (interview.status === 'completed') return 'Completed';
    if (scheduledDate < now && interview.status !== 'completed') return 'Missed';
    if (['pending', 'postpone', 'cancel'].includes(interview.status)) return 'Upcoming';
    return 'Scheduled';
  };

  const getStatusBadge = (interview: Interview) => {
    const status = getDisplayStatus(interview);
    const baseClasses = 'px-3 py-1 rounded-md text-sm font-medium';

    switch (status) {
      case 'Completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>;
      case 'Missed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Missed</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const renderJoinButton = (interview: Interview) => {
    const now = new Date();
    const scheduledDate = new Date(interview.scheduled_at);
    const isJoinable = now >= scheduledDate;

    if (['pending', 'postpone', 'cancel'].includes(interview.status)) {
      return isJoinable ? (
        <a
          href={interview.joining_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-1 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Start
        </a>
      ) : (
        <button
          disabled
          className="inline-block px-4 py-1 text-sm font-medium bg-gray-200 text-gray-500 rounded cursor-not-allowed"
        >
          Not Yet Started
        </button>
      );
    }

    return null;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto w-full">
      <h2 className="text-2xl font-semibold mb-6">Your Interviews</h2>
      <div className="space-y-4">
        {interviews.map((interview) => (
          <div
            key={interview._id}
            className="rounded-xl border shadow-sm p-5 bg-white hover:shadow-md transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-2">
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {interview.interview_type} Round {interview.round}
                </h3>
                <p className="text-sm text-gray-600">
                  Scheduled for: {format(new Date(interview.scheduled_at), 'PPpp')}
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1">
                {getStatusBadge(interview)}
                {renderJoinButton(interview)}
              </div>
            </div>

            <div className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Joining Link: </span>
              <a
                href={interview.joining_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {interview.joining_link}
              </a>
            </div>

            <div className="mt-2">
              <p className="font-medium text-gray-800">Interviewers:</p>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                {interview.interviewers?.length ? (
                  interview.interviewers.map((i, idx) => (
                    <li key={idx}>
                      {i.name} (
                      <a
                        href={`mailto:${i.email}`}
                        className="text-blue-500 hover:underline"
                      >
                        {i.email}
                      </a>
                      )
                    </li>
                  ))
                ) : (
                  <li>No interviewers listed</li>
                )}
              </ul>
            </div>
          </div>
        ))}

        {!interviews.length && (
          <div className="text-center text-gray-500 mt-10">
            No interviews found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Interviews;
