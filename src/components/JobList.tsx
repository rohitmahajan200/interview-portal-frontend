import { useAppSelector } from "@/hooks/useAuth"

const JobList = () => {
  const role = useAppSelector((state) => state.auth.user?.applied_job)
  console.log(role)
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
          <div className="w-full max-w-2xl bg-card shadow-sm rounded-xl p-6 space-y-4 flex items-start flex-col">
            <h3 className="text-xl sm:text-2xl font-bold text-card-foreground text-center">
              {role.title}
            </h3>

            {/* Scrollable section */}
            <div className="prose prose-sm sm:prose-base text-muted-foreground max-w-none max-h-64 overflow-y-auto pr-2">
              <div
                className="prose prose-sm sm:prose-base text-muted-foreground max-w-none max-h-64 overflow-y-auto pr-2"
                dangerouslySetInnerHTML={{ __html: role.description as unknown as string }}
              ></div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobList
