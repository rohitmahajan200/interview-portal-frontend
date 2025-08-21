// src/components/Manager/InterviewManagement.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const InterviewManagement: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Management</h1>
        <p className="text-muted-foreground">
          Schedule and manage final round interviews
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Interview Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Schedule final interviews with candidates who have passed the technical rounds.
            Manage interview panels and coordinate with other managers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewManagement;
