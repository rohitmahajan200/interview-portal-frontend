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

type Assessment = {
  _id: string;
  assessment_type: string;
  assigned_at: string;
  due_at: string;
  status: string;
};

const Assessments = () => {
  const [data, setData] = useState<Assessment[]>([]);

  useEffect(() => {
    const fetchAssessments = async () => {
      const response = await api.get("candidates/assessments");
      setData(response.data.assessments);
    };
    fetchAssessments();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 text-center">
        Assigned Assessments
      </h2>

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
        <Table className="min-w-[700px]">
          <TableCaption className="text-sm text-gray-500 p-4">
            A list of all assigned assessments.
          </TableCaption>

          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="whitespace-nowrap text-center">Type</TableHead>
              <TableHead className="whitespace-nowrap text-center">Status</TableHead>
              <TableHead className="whitespace-nowrap text-center">Assign Date</TableHead>
              <TableHead className="whitespace-nowrap text-center">
                Action
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                Due Date
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((assessment) => (
              <TableRow key={assessment._id}>
                <TableCell className="font-medium capitalize text-center">
                  {assessment.assessment_type}
                </TableCell>
                <TableCell className="capitalize text-center text-gray-700">
                  {assessment.status}
                </TableCell>
                <TableCell className="text-center text-gray-600">
                  {new Date(assessment.assigned_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {assessment.status === "pending" && (
                    <button className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md border border-yellow-300 hover:bg-yellow-200 text-sm font-medium transition">
                      Start
                    </button>
                  )}

                  {assessment.status === "started" && (
                    <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md border border-blue-300 hover:bg-blue-200 text-sm font-medium transition">
                      In Progress
                    </button>
                  )}

                  {assessment.status === "completed" && (
                    <button className="bg-green-100 text-green-800 px-3 py-1 rounded-md border border-green-300 hover:bg-green-200 text-sm font-medium transition">
                      Attempted
                    </button>
                  )}

                  {assessment.status === "expired" && (
                    <button className="bg-red-100 text-red-800 px-3 py-1 rounded-md border border-red-300 text-sm font-medium cursor-not-allowed">
                      Expired
                    </button>
                  )}
                </TableCell>
                <TableCell className="text-center text-gray-600">
                  {new Date(assessment.due_at).toLocaleString()}
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
