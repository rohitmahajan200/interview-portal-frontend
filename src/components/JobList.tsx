import { useAppSelector } from "@/hooks/useAuth"

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
  const role = useAppSelector((state) => state.auth.user?.applied_role) as Job | undefined;

  return (
    <div className="w-full bg-muted/50 rounded-xl px-4 py-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        Applied For Position
      </h2>

      <div className="flex justify-center">
        {!role ? (
          <p className="text-muted-foreground text-lg text-center">
            Not Applied For Any Role.
          </p>
        ) : (
          <div className="w-full max-w-2xl bg-card shadow-sm rounded-xl p-6 space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-card-foreground text-center">
              {role.name}
            </h3>

            <div className="space-y-2 text-muted-foreground text-sm sm:text-base">
              <p><span className="font-semibold">Description:</span></p>
              <p>Experience Required: <b>{role.description.expInYears}</b></p>
              <p>Time: {role.description.time}</p>
              <p>Location: {role.description.location}, {role.description.country}</p>
              <p>Salary: {role.description.salary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobList;
