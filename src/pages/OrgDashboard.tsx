import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentRole } from "@/features/Org/View/adminViewSlice";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/app/store";

// Import dashboard components
import Admin from '@/components/Admin/Admin';
import Hr from '@/components/Hr/Hr';
import Invigilator from '@/components/Invigilator/Invigilator';
import api from '@/lib/api';
import { setUser } from '@/features/Candidate/auth/authSlice';
import Manager from '@/components/Manager/Manager';
import Spinner from '@/components/ui/spinner';

const OrgDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const orgUser = useSelector((state: RootState) => state.orgAuth.user);
  const currentRole = useSelector((state: RootState) => state.adminView.currentRole);
  
  useEffect(() => {
    const fetchOrgUser = async () => {
      try {
        const response = await api.get("/org/me");
        
        if (response.data.user) {
          dispatch(setUser(response.data.user));
        } else {
          navigate("/org/login");
        }
      } catch (error) {
        console.error("Failed to fetch org user:", error);
        navigate("/org/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrgUser();
  }, [dispatch, navigate]);
  
   if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <Spinner></Spinner>
          </div>
        </div>
      );
    }

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
          {/* Fixed Tab Header - Height: 64px */}
          <TabsList className="flex-shrink-0 w-fit gap-2 p-1 border bg-background h-16 md:ml-64">
            <TabsTrigger value="ADMIN" className="px-6 py-2 whitespace-nowrap">Admin</TabsTrigger>
            <TabsTrigger value="HR" className="px-6 py-2 whitespace-nowrap">HR</TabsTrigger>
            <TabsTrigger value="INVIGILATOR" className="px-6 py-2 whitespace-nowrap">Invigilator</TabsTrigger>
            <TabsTrigger value="MANAGER" className="px-6 py-2 whitespace-nowrap">Manager</TabsTrigger>
          </TabsList>

          {/* Main Content Area - Remaining Height with Scroll */}
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
