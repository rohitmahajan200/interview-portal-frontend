import JobList from '@/components/JobList'
import { ProgressBar } from '@/components/ProgressBar'
import EventNotificationCard from '@/components/ui/EventNotificationCard'

const Home = () => {

      const applicationStatus = [
  {
    stage: 'registered',
    date: '2025-06-01',
    status: 'completed', // "completed" | "current" | "failed"
    comment: 'User registered'
  },
  {
    stage: 'hr',
    date: '2025-06-03',
    status: 'completed',
    comment: 'HR screening done'
  },
  {
    stage: 'assessment',
    date: '2025-07-09',
    status: 'completed',
    comment: 'Paased'
  },

  {
    stage: 'technical',
    date: '2025-08-01',
    status: 'completed',
    comment: 'Passed'
  },
  {
    stage: 'feedack',
    date: '2025-08-01',
    status: 'current',
    comment: '-'
  },
];

const dummyEvents = [
  {
    id: 1,
    type: "Assessment",
    title: "Frontend Developer Coding Round",
    date: "2025-08-01T10:00:00",
  },
  {
    id: 2,
    type: "Interview",
    title: "HR Round Interview",
    date: "2025-08-05T14:30:00",
  },
];


  return (
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            <JobList />
            <div className="bg-muted/50  rounded-xl">
            <EventNotificationCard events={dummyEvents} />
            </div>
          </div>
          <div className="bg-muted/50 min-h-[200px] rounded-xl p-4">
            <ProgressBar stages={applicationStatus} />
          </div>
        </div>

  )
}

export default Home