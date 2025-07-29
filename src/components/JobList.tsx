import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

type JobDescription = {
  time: string;
  country: string;
  location: string;
  expInYears: string;
  salary: string;
  jobId: string;
};

type Job = {
  _id: string;
  name: string;
  description: JobDescription;
};

const JobList = () => {
  const [allJob, setAllJob] = useState<Job[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);


  useEffect(() => {
    async function fetchList() {
      try {
        const response = await api.get('/candidates/roles');
        setAllJob(response.data.roles || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    }
    fetchList();
  }, []);

  const handleNext = () => {
    if (currentIndex < allJob.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleApply = (job: Job) => {
    alert(`Applying to: ${job.name}`);
  };

  const job = allJob[currentIndex];

  return (
    <div className="w-full bg-muted/50 rounded-xl px-4 py-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        Open Positions
      </h2>

      <div className="flex justify-center">
        {allJob.length === 0 ? (
          <p className="text-gray-600 text-lg text-center">
            No open roles available currently.
          </p>
        ) : (
          <div className="w-full max-w-2xl bg-white shadow-md rounded-xl p-6 space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
              {job.name}
            </h3>

            <div className="space-y-2 text-gray-700 text-sm sm:text-base">
              <p><span className="font-semibold">Description:</span></p>
              <p>Experience Required: <b>{job.description.expInYears} years</b></p>
              <p>Time: {job.description.time}</p>
              <p>Location: {job.description.location}, {job.description.country}</p>
              <p>Salary: {job.description.salary}</p>
              <Button
                onClick={() => handleApply(job)}
                className="w-full sm:w-auto bg-gray-900 hover:bg-black cursor-pointer text-white"
              >
                Apply
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="w-full sm:w-auto"
              >
                ← Previous
              </Button>

              

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === allJob.length - 1}
                className="w-full sm:w-auto"
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobList;
