import { useAppSelector } from "@/hooks/useAuth"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const JobList = () => {
  const role = useAppSelector((state) => state.auth.user?.applied_job)

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
            <div className="prose prose-sm sm:prose-base text-muted-foreground max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {String(role.description ?? "")}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobList
