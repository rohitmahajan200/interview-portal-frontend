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
import type { User } from "@/types/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import UpdateProfile from "@/components/UpdateProfile";
import { Clipboard, ClipboardCheck, Eye } from "lucide-react";

const DocumentRow = ({ doc }: { doc: { document_type: string; document_url: string } }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(doc.document_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-sm flex justify-between items-center p-3 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
      <div className="flex items-center gap-3">
        <span className="font-medium text-foreground">{doc.document_type}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs font-medium"
        >
          <a
            href={doc.document_url}
            target="_blank"
            rel="noreferrer"
          >
            <Eye />
          </a>
        </Button>
        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {copied ? (
            <ClipboardCheck className="h-4 w-4 text-green-500" />
          ) : (
            <Clipboard className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};

const Profile = () => {
  const user: User = useSelector((state: RootState) => state.auth.user!);
  const [isEditing, setIsEditing] = useState(false);

  if (!user) return <div>Loading...</div>;

  return isEditing ? (
    <UpdateProfile defaultValues={user} setIsEditing={setIsEditing} />
  ) : (
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
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsEditing(true)}
              >
                <span className="text-md">Edit Profile</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 sm:gap-3 text-sm text-foreground">
          <p>
            <strong>Phone:</strong> {user.phone ?? "N/A"}
          </p>
          <p>
            <strong>DOB:</strong>{" "}
            {user.date_of_birth
              ? format(new Date(user.date_of_birth), "dd/MM/yyyy")
              : "N/A"}
          </p>
          <p>
            <strong>Gender:</strong> {user.gender}
          </p>
          <p>
            <strong>Address:</strong> {user.address ?? "N/A"}
          </p>
          {user.portfolio_url !== "" &&
            user.portfolio_url !== undefined && (
              <p>
                <strong>Portfolio:</strong> {user.portfolio_url ?? "N/A"}
              </p>
            )}
          <p>
            <strong>Role:</strong> {user.applied_job?.name ?? "N/A"}
          </p>
          <p>
            <strong>Stage:</strong> {user.current_stage ?? "N/A"}
          </p>
          <p>
            <strong>Email Verified:</strong>{" "}
            {user.email_verified ? "Yes" : "No"}
          </p>
          <p>
            <strong>Registered On:</strong>{" "}
            {user.registration_date
              ? format(new Date(user.registration_date), "dd MMM yyyy")
              : "N/A"}
          </p>

          <p>
            <strong>Documents:</strong>
            {user.documents?.length ? (
            user.documents.map((doc, i) => (
              <DocumentRow key={i} doc={doc} />
            ))
          ) : (
            <p className="text-muted-foreground">No documents uploaded.</p>
          )}
          </p>
        </CardContent>
      </Card>

      

    </div>
  );
};

export default Profile;
