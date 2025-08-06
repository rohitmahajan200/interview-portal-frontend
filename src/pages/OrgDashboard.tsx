import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentRole } from "@/features/Org/View/adminViewSlice";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/app/store";

// Import dashboard components (create these)
import Admin from '@/components/Admin/Admin';
import Hr from '@/components/Hr/Hr';
import Invigilator from '@/components/Invigilator';
import Manager from '@/components/Manager';
import api from '@/lib/api';
import { setUser } from '@/features/Candidate/auth/authSlice';


const OrgDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get org user and admin view state
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
        setIsLoading(false); // Local state update
      }
    };

    fetchOrgUser();
  }, [dispatch, navigate]);
  
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div>Loading...</div>
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
      <div className="p-6">
        {renderRoleDashboard()}
      </div>
    );
  }
  
 return (
    <div className="w-full h-full flex flex-col  overflow-hidden">
      <Tabs 
        value={currentRole} 
        onValueChange={(value) => dispatch(setCurrentRole(value as "ADMIN" | "HR" | "INVIGILATOR" | "MANAGER"))}
        className="w-full h-full flex flex-col"
      >
    <div className="flex h-full flex-col">

      {/* ①  Tabs bar  */}
      <TabsList className="flex-shrink-0 w-fit gap-2 p-1 border-b bg-background  overflow-hidden">
        <TabsTrigger value="ADMIN"       className="px-6 py-2">Admin</TabsTrigger>
        <TabsTrigger value="HR"          className="px-6 py-2">HR</TabsTrigger>
        <TabsTrigger value="INVIGILATOR" className="px-6 py-2">Invigilator</TabsTrigger>
        <TabsTrigger value="MANAGER"     className="px-6 py-2">Manager</TabsTrigger>
      </TabsList>

      {/* ②  Content area  */}
      <div className="flex-1 overflow-hidden">
        <TabsContent value="ADMIN"       className="h-full  overflow-hidden">
          <Admin />
        </TabsContent>

        <TabsContent value="HR"          className="h-full  overflow-hidden">
          <Hr />
        </TabsContent>

        <TabsContent value="INVIGILATOR" className="h-full  overflow-hidden">
          <Invigilator />
        </TabsContent>

        <TabsContent value="MANAGER"     className="h-full  overflow-hidden">
          <Manager />
        </TabsContent>
      </div>

    </div>

      </Tabs>
    </div>
  );
};
export default OrgDashboard;
