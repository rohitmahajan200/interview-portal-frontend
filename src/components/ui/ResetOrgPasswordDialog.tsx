import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Shield } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

// Types
type Role = "ADMIN" | "HR" | "INVIGILATOR" | "MANAGER";

interface User {
  _id: string;
  name?: string;
  email: string;
  role: Role;
  email_verified: boolean;
  profilephotourl?: string;
}

// Zod schema
const passwordUpdateSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /(?=.*[a-z])/,
        "Password must contain at least one lowercase letter"
      )
      .regex(
        /(?=.*[A-Z])/,
        "Password must contain at least one uppercase letter"
      )
      .regex(/(?=.*\d)/, "Password must contain at least one number")
      .regex(
        /(?=.*[@$!%*?&])/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>;

// Props interface
interface ResetPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser?: User | null;
  onSuccess?: () => void;
  apiEndpoint?: string; // Optional custom API endpoint
}

const ResetOrgPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  selectedUser,
  apiEndpoint = "/org/update-password", // Default endpoint
}) => {
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Form with Zod validation
  const passwordUpdateForm = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update user password
  const onPasswordUpdateSubmit = async (data: PasswordUpdateFormData) => {

    try {
      setIsUpdatingPassword(true);
      let response;
      if (selectedUser){
      response = await api.patch(`${apiEndpoint}/${selectedUser._id}`, {
        newPassword: data.newPassword,
      });
    }else{
        response = await api.post(apiEndpoint,{
            password:data.newPassword,
            confirmPassword:data.confirmPassword
        });
    }
        

      if (response.data.success) {
        toast.success("Password updated successfully");
        onOpenChange(false);
        passwordUpdateForm.reset();
        onSuccess?.(); // Call success callback if provided
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update password"
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      passwordUpdateForm.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Update Password
          </DialogTitle>
          <DialogDescription>
            Set a new password for this user. They will need to use this
            password to log in.
          </DialogDescription>
        </DialogHeader>

            <form
              onSubmit={passwordUpdateForm.handleSubmit(onPasswordUpdateSubmit)}
              className="space-y-4"
            >
              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  {...passwordUpdateForm.register("newPassword")}
                  disabled={isUpdatingPassword}
                />
                {passwordUpdateForm.formState.errors.newPassword && (
                  <p className="text-red-600 text-sm">
                    {passwordUpdateForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  {...passwordUpdateForm.register("confirmPassword")}
                  disabled={isUpdatingPassword}
                />
                {passwordUpdateForm.formState.errors.confirmPassword && (
                  <p className="text-red-600 text-sm">
                    {passwordUpdateForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Password Requirements:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                  <li>• Contains at least one special character (@$!%*?&)</li>
                </ul>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isUpdatingPassword}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
        
      </DialogContent>
    </Dialog>
  );
};

export default ResetOrgPasswordDialog;
