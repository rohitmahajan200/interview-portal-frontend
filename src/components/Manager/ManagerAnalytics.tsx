// src/components/Manager/ManagerAnalytics.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const ManagerAnalytics: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manager Analytics</h1>
        <p className="text-muted-foreground">
          View hiring analytics and performance metrics
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Hiring Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Track hiring performance, candidate conversion rates, and team metrics.
            Analyze interview feedback trends and make data-driven decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerAnalytics;
