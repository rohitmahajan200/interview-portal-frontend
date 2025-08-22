import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  Lock,
  Play
} from "lucide-react";
import api from "@/lib/api";
import ProctorGhost from "@/components/ProctorGhost";
import AssessmentInterface from "@/components/AssessmentInterface";
import ProctorSnapshots from "@/components/ProctorSnapshots";
import toast from "react-hot-toast";
import { sebHeaders } from "@/lib/sebHashes";


const SecureAssessmentLanding = () => {
  const [token, setToken] = useState("");
  const [assessment, setAssessment] = useState<any>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Step 1 → Entry
  const handleEntry = async () => {
    if (!token.trim()) {
      toast.error("Please enter a valid access token");
      return;
    }

    try {
      setIsLoading(true);
      const url = `/candidates/seb/entry?token=${encodeURIComponent(token)}`;
      const res = await api.post(`/candidates/seb/entry?token=${token}`, { token }, { headers: await sebHeaders(url) });
      const id = res.data.data.assessmentId;
      setAssessmentId(id);
      setMessage("Entry successful. Please review the instructions below.");
      toast.success("Successfully authenticated!");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to authenticate with SEB";
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 → Start exam
  const handleStart = async () => {
    if (!assessmentId) return;
    
    try {
      setIsLoading(true);
      const startUrl = `/candidates/assessments/${assessmentId}/start`;
      await api.post(startUrl, null, { headers: await sebHeaders(startUrl) });

      const getUrl = `/candidates/assessments/${assessmentId}`;
      const { data } = await api.get(getUrl, { headers: await sebHeaders(getUrl) });

      setAssessment(data.data.assessment);
      setStarted(true);
      setMessage("");
      toast.success("Assessment started successfully!");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to start assessment";
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful submission
  const handleSubmissionComplete = () => {
    setShowSuccessDialog(true);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
              Secure Assessment Portal
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Step 1: Token Entry */}
        {!assessmentId && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Access Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Access Token</Label>
                <Input
                  id="token"
                  placeholder="Enter your secure access token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEntry()}
                />
              </div>
              
              <Button 
                onClick={handleEntry} 
                className="w-full"
                disabled={isLoading || !token.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Authenticate & Enter
                  </>
                )}
              </Button>

              {message && (
                <Alert className={message.includes('successful') ? '' : 'border-red-200 bg-red-50'}>
                  {message.includes('successful') ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Instructions */}
        {assessmentId && !started && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assessment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Important Guidelines */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Important Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Once started, the exam timer will begin immediately and cannot be paused
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    You must answer all questions before submitting the assessment
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Do not close or refresh the browser during the assessment
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Ensure stable internet connection throughout the exam
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    The assessment will auto-submit when time expires
                  </li>
                </ul>
              </div>

              {/* Assessment Info */}
              {assessment && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="font-semibold">{assessment.questions?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="font-semibold">{assessment.exam_duration ? formatDuration(assessment.exam_duration) : 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Badge className="mb-2" variant={assessment.status === 'pending' ? 'secondary' : 'default'}>
                      {assessment.status?.toUpperCase()}
                    </Badge>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  When you're ready to begin, click the button below. Make sure you have enough time to complete the entire assessment.
                </p>
                
                <Button 
                  onClick={handleStart}
                  size="lg"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start Assessment
                    </>
                  )}
                </Button>
              </div>

              {message && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Assessment Interface */}
        {started && assessment && assessmentId && (
          <AssessmentInterface
            assessmentId={assessmentId}
            onSubmissionComplete={handleSubmissionComplete}
          />
        )}
        <ProctorGhost />
        <ProctorSnapshots active={started} />

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Assessment Submitted Successfully!
              </DialogTitle>
              <DialogDescription className="text-center py-4">
                Your assessment has been submitted and saved. You can now safely close this window.
              </DialogDescription>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ Your responses have been recorded<br />
                  ✅ Submission timestamp: {new Date().toLocaleString()}<br />
                  ✅ You will be notified of your results via email
                </p>
              </div>
              <Button onClick={() => window.close()} className="w-full">
                Close Window
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SecureAssessmentLanding;
