import React, { useState, useEffect } from "react";
import { Phone, Loader2, RefreshCw, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
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

interface HRCallingDetailsDisplayProps {
  candidateId: string;
  candidateName?: string;
  userRole: "hr" | "manager";
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
  const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([]);
  const [newKey, setNewKey] = useState("");
  const [hrCallingCollapsed, setHrCallingCollapsed] = useState(false);

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

        if (isHR) {
          const defaultFields = [
            { id: "1", key: "Current CTC", value: "" },
            { id: "2", key: "Expected CTC", value: "" },
            { id: "3", key: "Notice Period", value: "" },
            { id: "4", key: "Experience", value: "" },
            { id: "5", key: "Location", value: "" },
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
            { id: "2", key: "Expected CTC", value: "" },
            { id: "3", key: "Notice Period", value: "" },
            { id: "4", key: "Experience", value: "" },
            { id: "5", key: "Location", value: "" },
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

  const handleSubmitCallingDetails = async () => {
    if (!isHR || !candidateId) return;

    const callingDetailsToSubmit = keyValuePairs
      .filter((pair) => pair.key.trim() !== "" && pair.value.trim() !== "")
      .map(({ key, value }) => ({ key: key.trim(), value: value.trim() }));

    if (callingDetailsToSubmit.length === 0) {
      toast.error("Please add at least one calling detail");
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
        toast.success("Details submitted successfully!");
        await loadCallingDetails();
      } else {
        toast.error(response.data.message || "Failed to submit");
      }
    } catch (error: any) {
      console.error("Error submitting:", error);
      toast.error("Failed to submit details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
        <span className="text-red-700">Error: {error}</span>
        <Button size="sm" variant="ghost" onClick={loadCallingDetails} className="ml-2">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (!hasData && isManager) {
    return (
      <div className="p-3 text-center bg-gray-50 rounded">
        <Phone className="h-5 w-5 text-gray-400 mx-auto mb-1" />
        <p className="text-xs text-gray-500">No calling details available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">HR Calling Details</span>
          {candidateName && (
            <span className="text-xs text-gray-500">- {candidateName}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHrCallingCollapsed(!hrCallingCollapsed)}
            className="text-xs p-1"
          >
            {hrCallingCollapsed ? "Show" : "Hide"}
            {hrCallingCollapsed ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronUp className="h-3 w-3 ml-1" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={loadCallingDetails} className="p-1">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!hrCallingCollapsed && (
        <div className="space-y-3">
          {/* HR Edit Mode */}
          {isHR && (
            <div className="space-y-2">
              <div className="space-y-2">
                {keyValuePairs.map((pair) => (
                  <div key={pair.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Input
                        value={pair.key}
                        onChange={(e) => updateKey(pair.id, e.target.value)}
                        placeholder="Field"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="col-span-7">
                      <Input
                        value={pair.value}
                        onChange={(e) => updateValue(pair.id, e.target.value)}
                        placeholder="Details"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePair(pair.id)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="New field name"
                  className="text-xs h-8"
                />
                <Button onClick={addNewPair} disabled={!newKey.trim()} size="sm" className="h-8">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label>
                <Textarea
                  value={hrRemarks}
                  onChange={(e) => setHrRemarks(e.target.value)}
                  placeholder="Enter remarks..."
                  className="text-xs"
                  rows={2}
                />
              </div>

              <Button
                className="w-full h-8 text-xs"
                onClick={handleSubmitCallingDetails}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-3 w-3 mr-1" />
                    Submitting...
                  </>
                ) : (
                  "Submit Details"
                )}
              </Button>
            </div>
          )}

          {/* Manager Read-Only Mode */}
          {isManager && hasData && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                {callingDetails.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                    <span className="font-medium text-gray-600">{detail.key}:</span>
                    <span className="text-gray-900">{detail.value}</span>
                  </div>
                ))}
              </div>

              {hrRemarks && (
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-xs font-medium text-blue-700 mb-1">HR Remarks:</div>
                  <div className="text-xs text-gray-700">"{hrRemarks}"</div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t">
                <span>Total: {callingDetails.length} fields</span>
                {hrRemarks && <Badge variant="secondary" className="text-xs">Remarks ✓</Badge>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HRCallingDetailsDisplay;
