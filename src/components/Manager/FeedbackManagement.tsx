// src/components/Manager/FeedbackManagement.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

const FeedbackManagement: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback Management</h1>
        <p className="text-muted-foreground">
          Review and provide final feedback on candidates
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Candidate Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Review feedback from technical interviews and HR rounds. 
            Provide your final assessment and hiring recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackManagement;
