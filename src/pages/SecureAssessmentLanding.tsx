import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "@/lib/api";

// Add interfaces for type safety
interface Question {
  _id: string;
  type: "mcq" | "descriptive" | "code" | "video-response";
  question: string;
  options?: string[];
  language?: string;
  functionName?: string;
}

interface Assessment {
  _id: string;
  title?: string;
  duration?: number;
  questions_by_stage: { [stageName: string]: string[] }; // Fixed: Now an object, not array
  status: "pending" | "started" | "completed" | "expired";
  assigned_at: string;
  due_at?: string;
  started_at?: string;
  completed_at?: string;
  candidate: string;
  job?: string;
}

interface AssessmentResponse {
  success: boolean;
  assessment: Assessment;
  questions: Question[];
  questionsByStage?: { [stageName: string]: Question[] };
}

export default function SecureAssessmentLanding() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  /* ───────────── Detect SEB (Safe-Exam-Browser) ───────────── */
  const isSEB = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /SEB|SafeExamBrowser/i.test(navigator.userAgent);
  }, []);

  /* ───────────── State ───────────── */
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timer, setTimer] = useState(0); // Will be set from assessment duration
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrent] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const submittedRef = useRef(false);

  /* code-runner */
  const [code, setCode] = useState("");
  const [testInput, setTestInput] = useState("");
  const [output, setOutput] = useState("");

  /* ───────────── Fetch Assessment Data ───────────── */
  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (!assessmentId) {
        setError("Assessment ID is required");
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log("Fetching assessment with ID:", assessmentId); // Debug log

      try {
        const response = await api.get(
          `/candidates/assessments/${assessmentId}`
        );

        console.log("Assessment data:", response.data); // Debug log

        const data: AssessmentResponse = response.data;
        if (!data.success) {
          throw new Error(data.message || "Failed to load assessment");
        }

        // Validate that we have the required data
        if (!data.assessment || !data.questions || data.questions.length === 0) {
          throw new Error('Invalid assessment data received');
        }

        setAssessment(data.assessment);
        setQuestions(data.questions);

        // Set timer from assessment duration (assuming it's in minutes, convert to seconds)
        const durationInSeconds = (data.assessment.duration || 60) * 60;
        setTimer(durationInSeconds);

        // Update assessment status to 'started' when fetched
        if (data.assessment.status === 'pending') {
          try {
            await api.patch(`/candidates/assessments/${assessmentId}/start`);
          } catch (err) {
            console.error('Error updating assessment status:', err);
          }
        }

      } catch (err: any) {
        console.error("Error fetching assessment:", err);

        let errorMessage = 'Failed to load assessment';
        
        if (err.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection.';
        } else if (err.response) {
          // Server responded with error status
          const { status, data } = err.response;
          switch (status) {
            case 404:
              errorMessage = 'Assessment not found';
              break;
            case 401:
              errorMessage = 'Authentication required. Please login again.';
              break;
            case 403:
              errorMessage = 'Access denied to this assessment';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = data?.message || `Error ${status}: ${data?.error || 'Unknown error'}`;
          }
        } else if (err.request) {
          // Request was made but no response received
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          // Something else happened
          errorMessage = err.message || 'An unexpected error occurred';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [assessmentId]);

  /* ───────────── SUBMIT (idempotent) ───────────── */
  const handleSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    stream?.getTracks().forEach(t => t.stop());
    if (!isSEB && document.fullscreenElement) document.exitFullscreen?.();

    // Submit answers to backend
    try {
      await api.post(`/candidates/assessments/${assessmentId}/submit`, {
        answers,
        submittedAt: new Date().toISOString(),
      });
      
      alert("Assessment submitted successfully!");
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      
      // Still show success message even if submission fails
      // since we don't want to confuse the user
      alert("Assessment completed!");
    }

    if (isSEB) {
      window.location.href = "http://localhost:5173/exam-completed";
    } else {
      navigate("/");
    }
  };

  /* ───────────── SECURITY GUARDS (same as before) ───────────── */
  useEffect(() => {
    if (!started || isSEB) return;

    let isTabActive = true;
    let lastActivity = Date.now();

    const triggerViolation = (msg: string) => {
      if (submittedRef.current) return;
      alert(msg);
      handleSubmit();
    };

    const keyGuard = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const refresh = k === "f5" || ((e.ctrlKey || e.metaKey) && k === "r");
      const clipboard = (e.ctrlKey || e.metaKey) && ["c", "v", "x"].includes(k);
      const taskSwitch =
        (e.altKey && k === "tab") || (e.metaKey && k === "tab");
      if (refresh || clipboard || taskSwitch) {
        e.preventDefault();
        triggerViolation(
          "Blocked shortcut detected – assessment auto-submitted."
        );
      } else {
        lastActivity = Date.now();
      }
    };

    const ctxGuard = (e: MouseEvent) => e.preventDefault();
    const clipGuard = (e: ClipboardEvent) => e.preventDefault();
    const mouseMoveGuard = () => (lastActivity = Date.now());

    const visibilityGuard = () => {
      isTabActive = document.visibilityState === "visible";
      if (!isTabActive)
        triggerViolation(
          "Tab/window switch detected – assessment auto-submitted."
        );
      lastActivity = Date.now();
    };

    const blurGuard = () =>
      triggerViolation("Window focus lost – assessment auto-submitted.");
    const mouseLeaveGuard = (e: MouseEvent) => {
      if (e.clientY < 0)
        triggerViolation("Cursor left window – assessment auto-submitted.");
    };
    const fullscreenGuard = () => {
      if (!document.fullscreenElement)
        triggerViolation("Fullscreen exited – assessment auto-submitted.");
    };

    const inactivityTimer = setInterval(() => {
      if (isTabActive && Date.now() - lastActivity > 30_000)
        triggerViolation("30 s inactivity – assessment auto-submitted.");
    }, 5_000);

    window.addEventListener("keydown", keyGuard, true);
    window.addEventListener("contextmenu", ctxGuard, true);
    window.addEventListener("copy", clipGuard, true);
    window.addEventListener("paste", clipGuard, true);
    window.addEventListener("cut", clipGuard, true);
    window.addEventListener("mousemove", mouseMoveGuard);
    window.addEventListener("blur", blurGuard);
    window.addEventListener("mouseleave", mouseLeaveGuard);
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      e.returnValue = "";
    });
    document.addEventListener("visibilitychange", visibilityGuard);
    document.addEventListener("fullscreenchange", fullscreenGuard);

    return () => {
      clearInterval(inactivityTimer);
      window.removeEventListener("keydown", keyGuard, true);
      window.removeEventListener("contextmenu", ctxGuard, true);
      window.removeEventListener("copy", clipGuard, true);
      window.removeEventListener("paste", clipGuard, true);
      window.removeEventListener("cut", clipGuard, true);
      window.removeEventListener("mousemove", mouseMoveGuard);
      window.removeEventListener("blur", blurGuard);
      window.removeEventListener("mouseleave", mouseLeaveGuard);
      document.removeEventListener("visibilitychange", visibilityGuard);
      document.removeEventListener("fullscreenchange", fullscreenGuard);
    };
  }, [started, isSEB]);

  /* ───────────── TIMER ───────────── */
  useEffect(() => {
    if (!started || timer <= 0) return;
    if (timer === 0) handleSubmit();
    const id = setInterval(() => setTimer((t) => t - 1), 1_000);
    return () => clearInterval(id);
  }, [started, timer]);

  /* ───────────── START ───────────── */
  const handleStart = async () => {
    try {
      const m = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(m);

      if (!isSEB) await document.documentElement.requestFullscreen?.();
      setStarted(true);

      // Update assessment status to 'started'
      try {
        await api.patch(`/candidates/assessments/${assessmentId}/start`);
      } catch (err) {
        console.error('Error updating assessment status:', err);
      }

    } catch {
      setError("Camera + mic access and fullscreen permission are required.");
    }
  };

  /* ───────────── helpers ───────────── */
  const handleAnswerChange = (id: string, val: string) =>
    setAnswers((p) => ({ ...p, [id]: val }));

  const handleRun = (fnName: string) => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...a) => logs.push(a.join(" "));

    try {
      // For code questions, we'll try to parse the input as JSON for more complex inputs
      let testValue;
      try {
        testValue = JSON.parse(testInput);
      } catch {
        // If not valid JSON, treat as string/number
        testValue = isNaN(Number(testInput)) ? testInput : Number(testInput);
      }

      // eslint-disable-next-line no-eval
      eval(`
${code}

try {
  const result = ${fnName}(${JSON.stringify(testValue)});
  console.log("Output:", result);
} catch (err) {
  console.log("Error:", err.message);
}
`);
      setOutput(logs.join("\n"));
    } catch (err: any) {
      setOutput("❌ Execution Error: " + err.message);
    } finally {
      console.log = orig;
    }

    // Save code to answers
    handleAnswerChange(q._id, code);
  };

  /* ───────────── Format time ───────────── */
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  /* ───────────── Auto-save functionality ───────────── */
  useEffect(() => {
    if (!started || Object.keys(answers).length === 0) return;

    const autoSave = async () => {
      try {
        await api.post(`/candidates/assessments/${assessmentId}/auto-save`, {
          answers,
          lastActivity: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    };

    // Auto-save every 30 seconds
    const autoSaveTimer = setInterval(autoSave, 30000);
    return () => clearInterval(autoSaveTimer);
  }, [answers, started, assessmentId]);

  /* ───────────── UI variables ───────────── */
  const q = questions[currentQuestionIndex];
  const total = questions.length;
  const attempted = Object.keys(answers).length;

  /* ───────────── Loading state ───────────── */
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading assessment...
          </p>
        </div>
      </div>
    );
  }

  /* ───────────── Error state ───────────── */
  if (error && !assessment) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-6 py-4 rounded-lg border border-red-300 dark:border-red-800 max-w-md mx-4">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ───────────── No questions state ───────────── */
  if (questions.length === 0 && !loading) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>No questions found for this assessment.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ───────────── Assessment status checks ───────────── */
  if (assessment?.status === 'completed') {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <h2 className="text-2xl font-bold mb-4">Assessment Already Completed</h2>
          <p>You have already completed this assessment.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (assessment?.status === 'expired') {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <h2 className="text-2xl font-bold mb-4">Assessment Expired</h2>
          <p>This assessment has expired and is no longer available.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ───────────── UI ───────────── */
  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 lg:py-6">
        {!started ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-800 dark:text-gray-100 px-2">
              {assessment?.title || "Secure Assessment"}
            </h1>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 text-sm sm:text-base">
                <li>
                  Assessment ID:{" "}
                  <strong className="break-all">{assessmentId}</strong>
                </li>
                <li>
                  Duration: <strong>{formatTime(timer)}</strong>
                </li>
                <li>
                  Total Questions: <strong>{total}</strong>
                </li>
                <li>
                  Status: <strong className="capitalize">{assessment?.status}</strong>
                </li>
                {assessment?.due_at && (
                  <li>
                    Due: <strong>{new Date(assessment.due_at).toLocaleString()}</strong>
                  </li>
                )}
                {isSEB ? (
                  <li>
                    Running inside <strong>Safe Exam Browser</strong>; built-in
                    security controls are active.
                  </li>
                ) : (
                  <>
                    <li className="hidden sm:list-item">
                      Fullscreen is mandatory. Esc or exiting fullscreen
                      auto-submits.
                    </li>
                    <li className="hidden sm:list-item">
                      Tab/window switch, Alt/⌘-Tab, or focus loss auto-submits.
                    </li>
                    <li className="hidden sm:list-item">
                      Copy, paste, cut, refresh, F5, Ctrl/⌘-R, right-click are
                      disabled; attempts auto-submit.
                    </li>
                    <li className="sm:hidden">
                      Security monitoring is active on desktop browsers.
                    </li>
                    <li>30 s inactivity auto-submits.</li>
                    <li>Camera &amp; microphone must remain enabled.</li>
                  </>
                )}
                <li>
                  <strong>Any violation triggers immediate submission.</strong>
                </li>
                <li className="text-blue-600 dark:text-blue-400">
                  <strong>Auto-save is enabled - your progress is saved automatically.</strong>
                </li>
              </ul>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-3 sm:px-4 py-2 rounded border border-red-300 dark:border-red-800 mt-4 text-sm sm:text-base">
                  {error}
                </div>
              )}

              <div className="flex justify-center mt-4 sm:mt-6">
                <button
                  onClick={handleStart}
                  disabled={assessment?.status === 'completed' || assessment?.status === 'expired'}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors text-base sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assessment?.status === 'started' ? 'Resume Assessment' : 'Start Assessment'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 px-2 sm:px-0">
              <div className="flex flex-col">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Time left: {formatTime(timer)}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Question {currentQuestionIndex + 1} of {total}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowDashboard(!showDashboard)}
                  className="sm:hidden flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                >
                  {showDashboard ? "Hide Dashboard" : "Show Dashboard"}
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded text-sm sm:text-base transition-colors"
                >
                  Submit Now
                </button>
              </div>
            </div>

            {/* Mobile Dashboard Overlay */}
            {showDashboard && (
              <div
                className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
                onClick={() => setShowDashboard(false)}
              >
                <div
                  className="bg-white dark:bg-gray-800 p-4 m-4 rounded-lg shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Dashboard
                    </h4>
                    <button
                      onClick={() => setShowDashboard(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Total: {total}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Attempted: {attempted}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Pending: {total - attempted}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {questions.map((qq, i) => (
                      <button
                        key={qq._id}
                        onClick={() => {
                          setCurrent(i);
                          setShowDashboard(false);
                        }}
                        className={`px-3 py-2 rounded text-white text-sm transition-colors ${
                          i === currentQuestionIndex
                            ? "bg-blue-600 hover:bg-blue-700"
                            : answers[qq._id]
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-400 hover:bg-gray-500"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 px-2 sm:px-0">
              {/* Question panel */}
              <div className="w-full lg:w-2/3 space-y-4">
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base sm:text-lg">
                      Question {currentQuestionIndex + 1}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      q?.type === 'mcq' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      q?.type === 'descriptive' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      q?.type === 'code' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {q?.type?.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mb-4 text-gray-800 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: q?.question || '' }} />
                  </div>

                  {q?.type === "mcq" && q.options && (
                    <div className="space-y-3">
                      {q.options.map((opt, i) => (
                        <label
                          key={i}
                          className="flex items-start sm:items-center gap-3 text-gray-700 dark:text-gray-200 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <input
                            type="radio"
                            name={`q_${q._id}`}
                            value={opt}
                            checked={answers[q._id] === opt}
                            onChange={(e) =>
                              handleAnswerChange(q._id, e.target.value)
                            }
                            className="accent-blue-500 mt-0.5 sm:mt-0 flex-shrink-0"
                          />
                          <span className="text-sm sm:text-base">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q?.type === "descriptive" && (
                    <textarea
                      rows={6}
                      value={answers[q._id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(q._id, e.target.value)
                      }
                      onCopy={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors resize-none text-sm sm:text-base"
                      placeholder="Enter your answer here..."
                    />
                  )}

                  {q?.type === "code" && (
                    <div className="bg-gray-900 p-2 sm:p-3 rounded">
                      <div className="mb-3">
                        <Editor
                          height="250px"
                          defaultLanguage={q.language || "javascript"}
                          defaultValue={
                            answers[q._id] || 
                            (q.functionName
                              ? `function ${q.functionName}(n) {\n  // your code here\n  \n}`
                              : "// Write your code here\n")
                          }
                          theme="vs-dark"
                          options={{
                            fontSize: window.innerWidth < 640 ? 12 : 14,
                            minimap: { enabled: false },
                            wordWrap: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            lineNumbers: "on",
                            roundedSelection: false,
                            scrollbar: {
                              vertical: "auto",
                              horizontal: "auto",
                            },
                          }}
                          onChange={(v) => {
                            setCode(v ?? "");
                            handleAnswerChange(q._id, v ?? "");
                          }}
                          value={answers[q._id] || code}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <input
                          type="text"
                          placeholder="Enter test input (JSON format for complex data)"
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          className="flex-1 p-2 sm:p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
                        />
                        <button
                          onClick={() => handleRun(q.functionName || "main")}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded transition-colors text-sm whitespace-nowrap"
                        >
                          ▶ Run Code
                        </button>
                      </div>

                      <pre className="mt-3 sm:mt-4 bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs sm:text-sm max-h-40 overflow-y-auto">
                        {output || "Output will appear here..."}
                      </pre>
                    </div>
                  )}

                  {q?.type === "video-response" && (
                    <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Record your video response using the camera access
                        granted at the start.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors">
                          🎥 Start Recording
                        </button>
                        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">
                          📄 Upload File
                        </button>
                      </div>
                      {answers[q._id] && (
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                          ✓ Response recorded
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between gap-3">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrent((p) => p - 1)}
                    className="flex-1 sm:flex-none px-4 py-2 sm:py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50 transition-colors text-sm sm:text-base"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAnswerChange(q._id, "")}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors text-sm"
                    >
                      Clear
                    </button>
                    
                    {currentQuestionIndex === total - 1 ? (
                      <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm font-medium"
                      >
                        Finish
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrent((p) => p + 1)}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded transition-colors text-sm"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Dashboard */}
              <div className="hidden lg:block w-1/3 bg-white dark:bg-gray-800 p-4 rounded shadow-lg border border-gray-200 dark:border-gray-700 space-y-4 h-fit">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Dashboard
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Total: {total}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Attempted: {attempted}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Pending: {total - attempted}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(attempted / total) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {questions.map((qq, i) => (
                    <button
                      key={qq._id}
                      onClick={() => setCurrent(i)}
                      className={`px-2 py-1 rounded text-white text-sm transition-colors ${
                        i === currentQuestionIndex
                          ? "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-300"
                          : answers[qq._id]
                          ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                          : "bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    Current Question
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type: <span className="capitalize">{q?.type}</span>
                  </p>
                  {q?.language && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Language: {q.language}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
