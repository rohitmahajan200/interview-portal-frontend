import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAuth";
import { setCurrentView } from "@/features/Candidate/view/viewSlice";
import api from "@/lib/api";
import { useState } from "react";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import ResetOrgPasswordDialog from "@/components/ui/ResetOrgPasswordDialog";
import ThemeToggleCard from "@/components/themeToggle";

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

    const [passwordUpdateDialogOpen, setPasswordUpdateDialogOpen] = useState(false);
  
    // Update the openPasswordUpdateDialog function
    const openPasswordUpdateDialog = () => {
      setPasswordUpdateDialogOpen(true);
    };


  const handleDeleteRequest = async () => {
    try {
      setLoadingDelete(true);
      await api.post("/candidates/request-delete"); // ✅ your backend route
      setOpenDeleteDialog(false);
      alert("✅ Your data deletion request has been submitted.");
       navigate("/");
    } catch (error) {
      console.error("Failed to request data deletion", error);
      alert("❌ Failed to request data deletion. Please try again.");
    } finally {
      setLoadingDelete(false);
    }
  };

  const settingsOptions = [
    {
      title: "Change Password",
      description: "Update your account password regularly to keep it secure.",
      actionLabel: "Change",
      onClick: () => openPasswordUpdateDialog()
    },
    {
      title: "Edit Profile",
      description: "Modify your name, email, and profile photo.",
      actionLabel: "Edit",
      onClick: () => dispatch(setCurrentView("profile")),
    },
    {
      title: "Download Personal Information",
      description: "Get a copy of your personal data stored on this platform.",
      actionLabel: "Download",
      onClick: async () => {
        try {
          const response = await api.get("/candidates/myinfo", {
            responseType: "blob",
          });
          const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "candidate-info.docx";
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        } catch (error) {
          console.error("Failed to download DOCX file", error);
        }
      },
    },
    {
      title: "Request Data Deletion",
      description: "Request permanent deletion of your personal data.",
      actionLabel: "Request",
      onClick: () => setOpenDeleteDialog(true), // ✅ open dialog
    },
  ];

  return (
    <div className="relative min-h-screen p-6 bg-background text-foreground">
      <h1 className="text-2xl font-semibold text-center mb-8">User Settings</h1>
      <div className="space-y-6 max-w-2xl mx-auto">
        <PushNotificationToggle />
        <ThemeToggleCard />
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
            </Button>
          </div>
        ))}
      </div>

      <ResetOrgPasswordDialog
        isOpen={passwordUpdateDialogOpen}
        onOpenChange={setPasswordUpdateDialogOpen}
        apiEndpoint="/candidates/new-password"
      />

      {/* ✅ Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              ⚠️ Confirm Data Deletion
            </DialogTitle>
            <DialogDescription>
              This action is <b>permanent</b> and will delete all your personal
              data from the platform. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRequest}
              disabled={loadingDelete}
            >
              {loadingDelete ? "Deleting..." : "Confirm Deletion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
