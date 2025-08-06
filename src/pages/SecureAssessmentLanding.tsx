import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

/* ───────────── Dummy data ───────────── */
const dummyQuestions = [
  { id: 1, type: "mcq", question: "What is the output of 2 + '2' in JavaScript?", options: ["4", "22", "NaN", "undefined"] },
  { id: 2, type: "descriptive", question: "Explain event loop in JavaScript." },
  { id: 4, type: "code", question: "Write a function to check if a number is prime.", language: "javascript", functionName: "checkPrime" },
  { id: 5, type: "video-response", question: "Please explain your solution approach by recording a short video (max 1 minute)." }
];

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
  const [timer, setTimer] = useState(60);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIndex, setCurrent] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showDashboard, setShowDashboard] = useState(false); // For mobile dashboard toggle
  const submittedRef = useRef(false);

  /* code-runner */
  const [code, setCode] = useState("");
  const [testInput, setTestInput] = useState("");
  const [output, setOutput] = useState("");

  /* ───────────── SUBMIT (idempotent) ───────────── */
  const handleSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    stream?.getTracks().forEach(t => t.stop());
    if (!isSEB && document.fullscreenElement) document.exitFullscreen?.();

    alert("Assessment submitted successfully!");

    if (isSEB) {
      window.location.href = "http://localhost:5173/exam-completed";
    } else {
      navigate("/");
    }
  };

  /* ───────────── SECURITY GUARDS (skip inside SEB) ───────────── */
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
      const taskSwitch = (e.altKey && k === "tab") || (e.metaKey && k === "tab");
      if (refresh || clipboard || taskSwitch) {
        e.preventDefault();
        triggerViolation("Blocked shortcut detected – assessment auto-submitted.");
      } else {
        lastActivity = Date.now();
      }
    };

    const ctxGuard = (e: MouseEvent) => e.preventDefault();
    const clipGuard = (e: ClipboardEvent) => e.preventDefault();
    const mouseMoveGuard = () => (lastActivity = Date.now());

    const visibilityGuard = () => {
      isTabActive = document.visibilityState === "visible";
      if (!isTabActive) triggerViolation("Tab/window switch detected – assessment auto-submitted.");
      lastActivity = Date.now();
    };

    const blurGuard = () => triggerViolation("Window focus lost – assessment auto-submitted.");
    const mouseLeaveGuard = (e: MouseEvent) => {
      if (e.clientY < 0) triggerViolation("Cursor left window – assessment auto-submitted.");
    };
    const fullscreenGuard = () => {
      if (!document.fullscreenElement) triggerViolation("Fullscreen exited – assessment auto-submitted.");
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
    window.addEventListener("beforeunload", e => { e.preventDefault(); e.returnValue = ""; });
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
    if (!started) return;
    if (timer === 0) handleSubmit();
    const id = setInterval(() => setTimer(t => t - 1), 1_000);
    return () => clearInterval(id);
  }, [started, timer]);

  /* ───────────── START ───────────── */
  const handleStart = async () => {
    try {
      const m = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(m);

      if (!isSEB) await document.documentElement.requestFullscreen?.();
      setStarted(true);
    } catch {
      setError("Camera + mic access and fullscreen permission are required.");
    }
  };

  /* ───────────── helpers ───────────── */
  const handleAnswerChange = (id: number, val: string) =>
    setAnswers(p => ({ ...p, [id]: val }));

  const handleRun = (fnName: string) => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...a) => logs.push(a.join(" "));

    const n = Number(testInput);
    if (Number.isNaN(n)) {
      setOutput("❗ Please enter a valid number.");
      console.log = orig;
      return;
    }

    try {
      // eslint-disable-next-line no-eval
      eval(`
${code}

try {
  const result = ${fnName}(${n});
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
  };

  /* ───────────── UI variables ───────────── */
  const q = dummyQuestions[currentQuestionIndex];
  const total = dummyQuestions.length;
  const attempted = Object.keys(answers).length;

  /* ───────────── UI ───────────── */
  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 lg:py-6">
        {!started ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-800 dark:text-gray-100 px-2">
              Secure Assessment
            </h1>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 text-sm sm:text-base">
                <li>Assessment ID: <strong className="break-all">{assessmentId}</strong></li>
                <li>Duration: <strong>1 minute</strong></li>
                {isSEB ? (
                  <li>Running inside <strong>Safe Exam Browser</strong>; built-in security controls are active.</li>
                ) : (
                  <>
                    <li className="hidden sm:list-item">Fullscreen is mandatory. Esc or exiting fullscreen auto-submits.</li>
                    <li className="hidden sm:list-item">Tab/window switch, Alt/⌘-Tab, or focus loss auto-submits.</li>
                    <li className="hidden sm:list-item">Copy, paste, cut, refresh, F5, Ctrl/⌘-R, right-click are disabled; attempts auto-submit.</li>
                    <li className="sm:hidden">Security monitoring is active on desktop browsers.</li>
                    <li>30 s inactivity auto-submits.</li>
                    <li>Camera &amp; microphone must remain enabled.</li>
                  </>
                )}
                <li><strong>Any violation triggers immediate submission.</strong></li>
              </ul>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-3 sm:px-4 py-2 rounded border border-red-300 dark:border-red-800 mt-4 text-sm sm:text-base">
                  {error}
                </div>
              )}

              <div className="flex justify-center mt-4 sm:mt-6">
                <button
                  onClick={handleStart}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors text-base sm:text-sm"
                >
                  Start Assessment
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 px-2 sm:px-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Time left: {timer}s
              </h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowDashboard(!showDashboard)}
                  className="sm:hidden flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                >
                  {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
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
              <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDashboard(false)}>
                <div className="bg-white dark:bg-gray-800 p-4 m-4 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Dashboard</h4>
                    <button 
                      onClick={() => setShowDashboard(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">Total: {total}</p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">Attempted: {attempted}</p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">Pending: {total - attempted}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {dummyQuestions.map((qq, i) => (
                      <button
                        key={qq.id}
                        onClick={() => {
                          setCurrent(i);
                          setShowDashboard(false);
                        }}
                        className={`px-3 py-2 rounded text-white text-sm ${
                          answers[qq.id]
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
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base sm:text-lg">
                    Question {currentQuestionIndex + 1}
                  </h3>
                  <p className="mb-4 text-gray-800 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                    {q.question}
                  </p>

                  {q.type === "mcq" && (
                    <div className="space-y-3">
                      {q.options!.map((opt, i) => (
                        <label key={i} className="flex items-start sm:items-center gap-3 text-gray-700 dark:text-gray-200 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={e => handleAnswerChange(q.id, e.target.value)}
                            className="accent-blue-500 mt-0.5 sm:mt-0 flex-shrink-0"
                          />
                          <span className="text-sm sm:text-base">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "descriptive" && (
                    <textarea
                      rows={6}
                      value={answers[q.id] || ""}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      onCopy={e => e.preventDefault()}
                      onPaste={e => e.preventDefault()}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors resize-none text-sm sm:text-base"
                      placeholder="Enter your answer here..."
                    />
                  )}

                  {q.type === "code" && (
                    <div className="bg-gray-900 p-2 sm:p-3 rounded">
                      <div className="mb-3">
                        <Editor
                          height="200px"
                          defaultLanguage="javascript"
                          defaultValue={`function checkPrime(n) {\n  // your code\n}`}
                          theme="vs-dark"
                          options={{ 
                            fontSize: window.innerWidth < 640 ? 12 : 14, 
                            minimap: { enabled: false },
                            wordWrap: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true
                          }}
                          onChange={v => setCode(v ?? "")}
                          value={code}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <input
                          type="number"
                          placeholder="Enter number to test"
                          value={testInput}
                          onChange={e => setTestInput(e.target.value)}
                          className="flex-1 p-2 sm:p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
                        />
                        <button
                          onClick={() => handleRun(q.functionName!)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded transition-colors text-sm whitespace-nowrap"
                        >
                          ▶ Run Code
                        </button>
                      </div>

                      <pre className="mt-3 sm:mt-4 bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs sm:text-sm">
                        {output || "Output will appear here..."}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between gap-3">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrent(p => p - 1)}
                    className="flex-1 sm:flex-none px-4 py-2 sm:py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50 transition-colors text-sm sm:text-base"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentQuestionIndex === total - 1}
                    onClick={() => setCurrent(p => p + 1)}
                    className="flex-1 sm:flex-none px-4 py-2 sm:py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50 transition-colors text-sm sm:text-base"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Desktop Dashboard */}
              <div className="hidden lg:block w-1/3 bg-white dark:bg-gray-800 p-4 rounded shadow-lg border border-gray-200 dark:border-gray-700 space-y-4 h-fit">
                <h4 className="font-semibold text-gray-900 dark:text-white">Dashboard</h4>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300 text-sm">Total: {total}</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">Attempted: {attempted}</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">Pending: {total - attempted}</p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {dummyQuestions.map((qq, i) => (
                    <button
                      key={qq.id}
                      onClick={() => setCurrent(i)}
                      className={`px-2 py-1 rounded text-white text-sm transition-colors ${
                        answers[qq.id]
                          ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                          : "bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
