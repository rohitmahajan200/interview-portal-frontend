import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAuth";
import { setCurrentView } from "@/features/view/viewSlice";
import api from "@/lib/api";

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settingsOptions = [
    {
      title: "Change Password",
      description: "Update your account password regularly to keep it secure.",
      actionLabel: "Change",
      svg: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          className="lucide lucide-external-link-icon lucide-external-link"
        >
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      ),
      onClick: () => {
        navigate("/forget-password");
      },
    },
    {
      title: "Edit Profile",
      description: "Modify your name, email, and profile photo.",
      actionLabel: "Edit",
      svg: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          className="lucide lucide-external-link-icon lucide-external-link"
        >
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      ),

      onClick: () => {
        dispatch(setCurrentView("profile"));
      },
    },
    {
      title: "Download Personal Information",
      description: "Get a copy of your personal data stored on this platform.",
      actionLabel: "Download",
      svg: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          className="lucide lucide-cloud-download-icon lucide-cloud-download"
        >
          <path d="M12 13v8l-4-4" />
          <path d="m12 21 4-4" />
          <path d="M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284" />
        </svg>
      ),
      onClick: () => {
        const getdata = async () => {
          try {
            const response = await api.get("/candidates/myinfo", {
              responseType: "blob", // Important: treat it as binary data
            });

            // Create a blob from the response data
            const blob = new Blob([response.data], {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            // Create a temporary URL
            const url = window.URL.createObjectURL(blob);

            // Create a download link
            const link = document.createElement("a");
            link.href = url;
            link.download = "candidate-info.docx";
            document.body.appendChild(link);
            link.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
          } catch (error) {
            console.error("Failed to download DOCX file", error);
          }
        };

        getdata();
      },
    },
    {
      title: "Request Data Deletion",
      description: "Request permanent deletion of your personal data.",
      actionLabel: "Request",
      svg: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          className="lucide lucide-external-link-icon lucide-external-link"
        >
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      ),

      onClick: () => {
        console.log("Request deletion clicked");
      },
    },
  ];

  return (
    <div className="relative min-h-screen p-6 bg-background text-foreground">
      <h1 className="text-2xl font-semibold text-center mb-8">User Settings</h1>

      <div className="space-y-6 max-w-2xl mx-auto">
        {settingsOptions.map((option, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/50 border border-border rounded-xl p-4 shadow-sm transition"
          >
            <div className="space-y-1">
              <h2 className="text-base font-medium">{option.title}</h2>
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>
            </div>
            <Button
              className="mt-4 sm:mt-0 hover:cursor-pointer"
              onClick={option.onClick}
            >
              {option.actionLabel}
              {option?.svg}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
