// src/pages/OrgDashboard.tsx
import React, { useEffect } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentRole } from "@/features/Org/View/adminViewSlice";
import type { RootState } from "@/app/store";

// Import dashboard components
import Admin from '@/components/Admin/Admin';
import Hr from '@/components/Hr/Hr';
import Invigilator from '@/components/Invigilator/Invigilator';
import Manager from '@/components/Manager/Manager';
import api from '@/lib/api';
import { setUser } from '@/features/Candidate/auth/authSlice';

const OrgDashboard = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const fetchOrgUser = async () => {
      try {
        const response = await api.get("/org/me");
        if (response.data.user) {
          dispatch(setUser(response.data.user));
        }
      } catch (error) {
        console.error("Failed to fetch org user:", error);
        // Don't navigate here - ProtectedRoute handles this
      }
    };

    fetchOrgUser();
  }, [dispatch]);
  
  const orgUser = useSelector((state: RootState) => state.orgAuth.user);
  const currentRole = useSelector((state: RootState) => state.adminView.currentRole);
  
  // If user is not admin, show only their role dashboard
  if (orgUser && orgUser.role !== "ADMIN") {
    const renderRoleDashboard = () => {
      switch (orgUser.role) {
        case "HR":
          return <Hr />;
        case "INVIGILATOR":
          return <Invigilator />;
        case "MANAGER":
          return <Manager />;
        default:
          return <div>Unknown role</div>;
      }
    };
    
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden">
        {renderRoleDashboard()}
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col">
      <Tabs 
        value={currentRole} 
        onValueChange={(value) => dispatch(setCurrentRole(value as "ADMIN" | "HR" | "INVIGILATOR" | "MANAGER"))}
        className="w-full h-full flex flex-col"
      >
        <div className="flex h-full flex-col">
          <div className="flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden">
            <TabsContent value="ADMIN" className="w-full h-full m-0 p-0 data-[state=active]:block data-[state=inactive]:hidden">
              <Admin />
            </TabsContent>

            <TabsContent value="HR" className="w-full h-full m-0 p-0 data-[state=active]:block data-[state=inactive]:hidden">
              <Hr />
            </TabsContent>

            <TabsContent value="INVIGILATOR" className="w-full h-full m-0 p-0 data-[state=active]:block data-[state=inactive]:hidden">
              <Invigilator />
            </TabsContent>

            <TabsContent value="MANAGER" className="w-full h-full m-0 p-0 data-[state=active]:block data-[state=inactive]:hidden">
              <Manager />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default OrgDashboard;
