import api from "@/lib/api";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

type Assessment = {
  _id: string;
  assessment_type: string;
  assigned_at: string;
  due_at: string;
  status: string;
};


const Assessments = () => {
  const navigate = useNavigate();
  const [assessment, setAssessmentData] = useState<Assessment[]>([])                      
  
  const handleStart = async (id: string,type:string) => {
    if(type=="technical"){
      navigate(`/start-assessment/${id}`);
    }else{
      navigate(`/start-hrqna`);
    }
  };

  useEffect(() => {
    const fetchAssessments = async () => {
      
      try {
        const response=await api.get('/candidates/assessments');
        setAssessmentData(response.data.combined);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchAssessments();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-6 text-center">
        Assigned Assessments
      </h2>

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Table className="min-w-[700px]">
          <TableCaption className="text-sm text-gray-500 dark:text-gray-400 p-4">
            A list of all assigned assessments.
          </TableCaption>

          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow>
              <TableHead className="whitespace-nowrap text-center text-gray-700 dark:text-gray-300">
                Type
              </TableHead>
              <TableHead className="whitespace-nowrap text-center text-gray-700 dark:text-gray-300">
                Status
              </TableHead>
              <TableHead className="whitespace-nowrap text-center text-gray-700 dark:text-gray-300">
                Assign Date
              </TableHead>
              <TableHead className="whitespace-nowrap text-center text-gray-700 dark:text-gray-300">
                Action
              </TableHead>
              <TableHead className="whitespace-nowrap text-center text-gray-700 dark:text-gray-300">
                Due Date
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {assessment.map((a) => (
              <TableRow
                key={a._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <TableCell className="font-medium capitalize text-center text-gray-800 dark:text-gray-200">
                  {a.assessment_type ?? "Technical"}
                </TableCell>

                <TableCell className="capitalize text-center text-gray-700 dark:text-gray-300">
                  {a.status}
                </TableCell>

                <TableCell className="text-center text-gray-600 dark:text-gray-400">
                  {new Date(a.assigned_at).toLocaleString()}
                </TableCell>

                <TableCell className="text-center">
                  {a.status === "pending" && (
                    <button
                      className="bg-yellow-100 dark:bg-yellow-300 text-yellow-800 px-3 py-1 rounded-md border border-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-400 text-sm font-medium transition"
                      onClick={() => handleStart(a._id,a.assessment_type)}
                    >
                      Start
                    </button>
                  )}

                  {a.status === "started" && (
                    <button className="bg-blue-100 dark:bg-blue-300 text-blue-800 px-3 py-1 rounded-md border border-blue-300 hover:bg-blue-200 dark:hover:bg-blue-400 text-sm font-medium transition">
                      In Progress
                    </button>
                  )}

                  {a.status === "completed" && (
                    <button className="bg-green-100 dark:bg-green-300 text-green-800 px-3 py-1 rounded-md border border-green-300 hover:bg-green-200 dark:hover:bg-green-400 text-sm font-medium transition">
                      Attempted
                    </button>
                  )}

                  {a.status === "expired" && (
                    <button className="bg-red-100 dark:bg-red-300 text-red-800 px-3 py-1 rounded-md border border-red-300 dark:border-red-400 text-sm font-medium cursor-not-allowed">
                      Expired
                    </button>
                  )}
                </TableCell>

                <TableCell className="text-center text-gray-600 dark:text-gray-400">
                  {new Date(a.due_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Assessments;
