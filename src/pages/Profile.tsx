import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User, StageHistory } from "@/types/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import UpdateProfile from "@/components/UpdateProfile";

const Profile = () => {
  const user: User = useSelector((state: RootState) => state.auth.user!);
  const [isEditing, setIsEditing] = useState(false);
  if (!user) return <div>Loading...</div>;

  return isEditing ? <UpdateProfile defaultValues={user} setIsEditing={setIsEditing}/> :  (
    <div className="grid gap-6 max-w-5xl px-4 sm:px-6 py-8">
      {/* Profile Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-32 h-32 rounded-full ring-2 ring-primary shrink-0">
              <AvatarImage
                src={user.profile_photo_url?.url}
                className="object-cover rounded-full"
              />
              <AvatarFallback className="text-2xl">
                {user.first_name[0]}
                {user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <CardTitle className="text-3xl font-bold text-foreground">
                {user.first_name} {user.last_name}
              </CardTitle>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
            </div>
            <div>
              <Button variant="outline" size="lg" onClick={() => setIsEditing(true)}>
                <span className="text-md">Edit Profile</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 sm:gap-3 text-sm text-foreground">
          <p><strong>Phone:</strong> {user.phone ?? "N/A"}</p>
          <p>
            <strong>DOB:</strong>{" "}
            {user.date_of_birth
              ? format(new Date(user.date_of_birth), "dd/MM/yyyy")
              : "N/A"}
          </p>
          <p><strong>Gender:</strong> {user.gender}</p>
          <p><strong>Address:</strong> {user.address ?? "N/A"}</p>
          {user.portfolio_url !== "" && user.portfolio_url !== undefined && <p><strong>Portfolio:</strong> {user.portfolio_url ?? "N/A"}</p>}
          <p><strong>Role:</strong> {user.applied_job?.name ?? "N/A"}</p>
          <p><strong>Stage:</strong> {user.current_stage ?? "N/A"}</p>
          <p><strong>Email Verified:</strong> {user.email_verified ? "Yes" : "No"}</p>
          <p>
            <strong>Registered On:</strong>{" "}
            {user.registration_date
              ? format(new Date(user.registration_date), "dd MMM yyyy")
              : "N/A"}
          </p>
        </CardContent>
      </Card>

      {/* Documents Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-foreground">Documents</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-foreground">
          {user.documents?.length ? (
            user.documents.map((doc, i) => (
              <div key={i} className="flex justify-between items-center border-b border-border pb-2">
                <span>{doc.document_type}</span>
                <a
                  href={doc.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  View
                </a>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No documents uploaded.</p>
          )}
        </CardContent>
      </Card>

      {/* Stage History Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-foreground">Stage History</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-foreground">
          {user.stage_history?.length ? (
            user.stage_history.map((item: StageHistory, i) => (
              <div key={i} className="p-3 border border-border rounded">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{item.to_stage}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.changed_at
                      ? format(new Date(item.changed_at), "dd MMM yyyy HH:mm")
                      : ""}
                  </span>
                </div>
                {item.remarks && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {item.remarks}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No stage history available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
