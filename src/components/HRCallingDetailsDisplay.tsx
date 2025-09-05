import React, { useState, useEffect } from "react";
import { Phone, MessageSquare, Loader2, RefreshCw, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface CallingDetail {
  key: string;
  value: string;
}

interface CallingDetailsResponse {
  success: boolean;
  message: string;
  data: {
    details: CallingDetail[];
    hrRemarks: string;
  };
}

interface HRCallingDetailsDisplayProps {
  candidateId: string;
  candidateName?: string;
  userRole: "hr" | "manager"; // NEW: Role-based access control
}

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

const HRCallingDetailsDisplay: React.FC<HRCallingDetailsDisplayProps> = ({
  candidateId,
  candidateName,
  userRole,
}) => {
  const [callingDetails, setCallingDetails] = useState<CallingDetail[]>([]);
  const [hrRemarks, setHrRemarks] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // HR-specific states for editing
  const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([]);
  const [newKey, setNewKey] = useState("");

  const isHR = userRole === "hr";
  const isManager = userRole === "manager";

  const loadCallingDetails = async () => {
    if (!candidateId) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await api.get(`/org/calling-details/${candidateId}`);
      
      if (response.data.success && response.data.data) {
        const details = response.data.data.details || [];
        const remarks = response.data.data.hrRemarks || "";
        
        setCallingDetails(details);
        setHrRemarks(remarks);
        setHasData(details.length > 0 || remarks.length > 0);

        // For HR users, convert to editable format
        if (isHR) {
          const defaultFields = [
            { id: "1", key: "Current CTC", value: "" },
            { id: "2", key: "In Hand Salary", value: "" },
            { id: "3", key: "Expected CTC", value: "" },
            { id: "4", key: "Reason for Change", value: "" },
            { id: "5", key: "Notice Period", value: "" },
            { id: "6", key: "Total Experience", value: "" },
            { id: "7", key: "Relevant Experience", value: "" },
            { id: "8", key: "Current Location", value: "" },
            { id: "9", key: "Preferred Location", value: "" },
            { id: "10", key: "Availability for Interview", value: "" },
          ];

          const loadedPairs: KeyValuePair[] = details.map(
            (item: any, index: number) => ({
              id: `loaded-${index}-${Date.now()}`,
              key: item.key || "",
              value: item.value || "",
            })
          );

          const mergedPairs = defaultFields.map((defaultField) => {
            const loadedPair = loadedPairs.find(
              (loaded) => loaded.key === defaultField.key
            );
            return loadedPair || defaultField;
          });

          const additionalPairs = loadedPairs.filter(
            (loaded) =>
              !defaultFields.some(
                (defaultField) => defaultField.key === loaded.key
              )
          );

          setKeyValuePairs([...mergedPairs, ...additionalPairs]);
        }
      } else {
        setCallingDetails([]);
        setHrRemarks("");
        setHasData(false);
        if (isHR) {
          const defaultFields = [
            { id: "1", key: "Current CTC", value: "" },
            { id: "2", key: "In Hand Salary", value: "" },
            { id: "3", key: "Expected CTC", value: "" },
            { id: "4", key: "Reason for Change", value: "" },
            { id: "5", key: "Notice Period", value: "" },
            { id: "6", key: "Total Experience", value: "" },
            { id: "7", key: "Relevant Experience", value: "" },
            { id: "8", key: "Current Location", value: "" },
            { id: "9", key: "Preferred Location", value: "" },
            { id: "10", key: "Availability for Interview", value: "" },
          ];
          setKeyValuePairs(defaultFields);
        }
      }
    } catch (error: any) {
      console.error("Error loading calling details:", error);
      setError("Failed to load calling details");
      setCallingDetails([]);
      setHrRemarks("");
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCallingDetails();
  }, [candidateId, userRole]);

  // HR-specific functions
  const updateKey = (id: string, newKey: string) => {
    if (!isHR) return;
    setKeyValuePairs(
      keyValuePairs.map((pair) =>
        pair.id === id ? { ...pair, key: newKey } : pair
      )
    );
  };

  const updateValue = (id: string, newValue: string) => {
    if (!isHR) return;
    setKeyValuePairs(
      keyValuePairs.map((pair) =>
        pair.id === id ? { ...pair, value: newValue } : pair
      )
    );
  };

  const addNewPair = () => {
    if (!isHR || !newKey.trim()) return;
    const newPair: KeyValuePair = {
      id: Date.now().toString(),
      key: newKey.trim(),
      value: "",
    };
    setKeyValuePairs([...keyValuePairs, newPair]);
    setNewKey("");
  };

  const deletePair = (id: string) => {
    if (!isHR) return;
    setKeyValuePairs(keyValuePairs.filter((pair) => pair.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addNewPair();
    }
  };

  const handleSubmitCallingDetails = async () => {
    if (!isHR || !candidateId) return;

    const callingDetailsToSubmit = keyValuePairs
      .filter((pair) => pair.key.trim() !== "" && pair.value.trim() !== "")
      .map(({ key, value }) => ({ key: key.trim(), value: value.trim() }));

    if (callingDetailsToSubmit.length === 0) {
      toast.error("Please add at least one calling detail before submitting");
      return;
    }

    try {
      setSaving(true);
      const response = await api.post("/org/calling-details", {
        candidateId,
        details: callingDetailsToSubmit,
        hrRemarks: hrRemarks,
      });

      if (response.data.success) {
        toast.success("Calling details submitted successfully!");
        await loadCallingDetails(); // Refresh data
      } else {
        toast.error(response.data.message || "Failed to submit calling details");
      }
    } catch (error: any) {
      console.error("Error submitting calling details:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit calling details";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Manager-specific helper functions
  const getDetailValue = (key: string): string => {
    const detail = callingDetails.find(d => d.key === key);
    return detail?.value || "Not provided";
  };

  const hasValue = (key: string): boolean => {
    const detail = callingDetails.find(d => d.key === key);
    return !!(detail?.value && detail.value.trim());
  };

  const standardFields = [
    { key: "Current CTC", icon: "💰" },
    { key: "In Hand Salary", icon: "💵" },
    { key: "Expected CTC", icon: "🎯" },
    { key: "Reason for Change", icon: "🔄" },
    { key: "Notice Period", icon: "⏰" },
    { key: "Total Experience", icon: "📈" },
    { key: "Relevant Experience", icon: "⚡" },
    { key: "Current Location", icon: "📍" },
    { key: "Preferred Location", icon: "🏠" },
    { key: "Availability for Interview", icon: "📅" },
  ];

  const customFields = callingDetails.filter(
    detail => !standardFields.some(field => field.key === detail.key)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading calling details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Error Loading Details</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadCallingDetails}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!hasData && isManager) {
    return (
      <div className="p-6 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <Phone className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <h4 className="text-sm font-medium text-gray-700 mb-1">
          No Calling Details Available
        </h4>
        <p className="text-xs text-gray-500">
          HR calling details have not been recorded for this candidate yet.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={loadCallingDetails}
          className="mt-3"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Phone className="h-4 w-4 text-blue-600" />
        HR Calling Details
        {candidateName && (
          <span className="text-sm font-normal text-gray-600">
            - {candidateName}
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={loadCallingDetails}
          disabled={loading}
          className="h-6 w-6 p-0 ml-auto"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        {isHR && (
          <Badge variant="secondary" className="text-xs ml-2">
            Edit Mode
          </Badge>
        )}
        {isManager && (
          <Badge variant="outline" className="text-xs ml-2">
            View Only
          </Badge>
        )}
      </h4>

      <div className="space-y-4">
        {/* HR Edit Mode */}
        {isHR && (
          <>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 items-center font-semibold text-sm text-gray-600 border-b pb-2">
                <div className="col-span-4">Field</div>
                <div className="col-span-7">Details</div>
                <div className="col-span-1">Action</div>
              </div>

              {/* Key-Value Pairs */}
              <div className="space-y-3">
                {keyValuePairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="grid grid-cols-12 gap-4 items-center"
                  >
                    <div className="col-span-4">
                      <Input
                        value={pair.key}
                        onChange={(e) => updateKey(pair.id, e.target.value)}
                        placeholder="Field name"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-7">
                      <Input
                        value={pair.value}
                        onChange={(e) => updateValue(pair.id, e.target.value)}
                        placeholder="Enter details..."
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePair(pair.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Field */}
              <div className="border-t pt-4">
                <div className="flex gap-2 items-center">
                  <Input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter new field name..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={addNewPair}
                    disabled={!newKey.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                </div>
              </div>

              {/* HR Remarks */}
              <div className="border-t pt-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Calling Remarks</h5>
                <Textarea
                  value={hrRemarks}
                  onChange={(e) => setHrRemarks(e.target.value)}
                  placeholder="Enter remarks here..."
                  className="text-sm"
                  rows={3}
                />
              </div>

              {/* Quick Stats */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Total Fields: {keyValuePairs.length}</span>
                  <span>
                    Completed: {keyValuePairs.filter((pair) => pair.value.trim()).length}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          keyValuePairs.length > 0
                            ? (keyValuePairs.filter((pair) => pair.value.trim()).length /
                                keyValuePairs.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <Button
                className="bg-green-600 hover:bg-green-700 text-white w-full"
                onClick={handleSubmitCallingDetails}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Details"
                )}
              </Button>
            </div>
          </>
        )}

        {/* Manager Read-Only Mode */}
        {isManager && hasData && (
          <>
            {/* Standard Fields */}
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                📋 Standard Information
                <Badge variant="secondary" className="text-xs">
                  {standardFields.filter(field => hasValue(field.key)).length}/{standardFields.length}
                </Badge>
              </h5>
              
              <div className="grid grid-cols-1 gap-3">
                {standardFields.map((field) => (
                  <div
                    key={field.key}
                    className={`p-3 rounded-lg border transition-all ${
                      hasValue(field.key)
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{field.icon}</span>
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {field.key}
                      </span>
                      {hasValue(field.key) && (
                        <Badge variant="outline" className="text-xs h-4 px-1">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`text-sm ${
                        hasValue(field.key)
                          ? "text-gray-900 font-medium"
                          : "text-gray-500 italic"
                      }`}
                    >
                      {getDetailValue(field.key)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  ⚡ Additional Information
                  <Badge variant="secondary" className="text-xs">
                    {customFields.length} custom fields
                  </Badge>
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customFields.map((detail, index) => (
                    <div
                      key={index}
                      className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">🔧</span>
                        <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                          {detail.key}
                        </span>
                        <Badge variant="outline" className="text-xs h-4 px-1 text-purple-600 border-purple-300">
                          Custom
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-900 font-medium">
                        {detail.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HR Remarks */}
            {hrRemarks && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  HR Remarks
                </h5>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-gray-900 leading-relaxed">
                    "{hrRemarks}"
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Completed Fields:</span>
                  <span className="text-blue-600 font-semibold">
                    {callingDetails.filter(d => d.value.trim()).length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Total Fields:</span>
                  <span className="text-gray-700 font-semibold">
                    {callingDetails.length}
                  </span>
                </div>
                {hrRemarks && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">HR Remarks:</span>
                    <Badge variant="secondary" className="text-xs">
                      ✓ Available
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HRCallingDetailsDisplay;
