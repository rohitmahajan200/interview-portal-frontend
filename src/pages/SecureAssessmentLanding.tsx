import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

/* ───────────── Dummy data ───────────── */
const dummyQuestions = [
  { id: 1, type: "mcq", question: "What is the output of 2 + '2' in JavaScript?", options: ["4", "22", "NaN", "undefined"] },
  { id: 2, type: "descriptive", question: "Explain event loop in JavaScript." },
  { id: 4, type: "code", question: "Write a function to check if a number is prime.", language: "javascript", functionName: "checkPrime" },
  { id: 5, type: "video-response", question: "Please explain your solution approach by recording a short video (max 1 minute)." },
];

export default function SecureAssessmentLanding() {
  const { assessmentId } = useParams();
  const navigate          = useNavigate();

  /* assessment state */
  const [started, setStarted]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [timer, setTimer]                       = useState(60);
  const [answers, setAnswers]                   = useState<Record<number,string>>({});
  const [currentQuestionIndex, setCurrent]      = useState(0);
  const [stream, setStream]                     = useState<MediaStream | null>(null);
  const submittedRef                            = useRef(false);

  /* code-runner state */
  const [code, setCode]         = useState("");
  const [testInput, setTestInput] = useState("");
  const [output, setOutput]     = useState("");

  /* SUBMIT (idempotent) */
  const handleSubmit = () => {
    alert("Assessment is submitted")
    if (submittedRef.current) return;
    submittedRef.current = true;
    stream?.getTracks().forEach(t => t.stop());
    if (document.fullscreenElement) document.exitFullscreen?.();
    navigate("/");
  };

  /* SECURITY GUARDS */
  useEffect(() => {
    if (!started) return;

    let isTabActive  = true;
    let lastActivity = Date.now();

    const triggerViolation = (msg: string) => {
      if (submittedRef.current) return;
      alert(msg);
      handleSubmit();
    };

    const keyGuard = (e: KeyboardEvent) => {
      const k          = e.key.toLowerCase();
      const refresh    = k === "f5" || ((e.ctrlKey||e.metaKey) && k === "r");
      const clipboard  = (e.ctrlKey||e.metaKey) && ["c","v","x"].includes(k);
      const taskSwitch = (e.altKey && k === "tab") || (e.metaKey && k === "tab");
      if (refresh || clipboard || taskSwitch) {
        e.preventDefault();
        triggerViolation("Blocked shortcut detected. Assessment auto-submitted.");
      } else {
        lastActivity = Date.now();
      }
    };

    const ctxGuard       = (e: MouseEvent)    => e.preventDefault();
    const clipGuard      = (e: ClipboardEvent)=> e.preventDefault();
    const mouseMoveGuard = () => (lastActivity = Date.now());

    const visibilityGuard = () => {
      isTabActive = document.visibilityState === "visible";
      if (!isTabActive) triggerViolation("Tab/window switch detected. Assessment auto-submitted.");
      lastActivity = Date.now();
    };

    const blurGuard       = () => triggerViolation("Window focus lost. Assessment auto-submitted.");
    const mouseLeaveGuard = (e: MouseEvent) => { if (e.clientY < 0) triggerViolation("Cursor left window. Assessment auto-submitted."); };
    const fullscreenGuard = () => { if (!document.fullscreenElement) triggerViolation("Fullscreen exited. Assessment auto-submitted."); };

    const inactivityTimer = setInterval(() => {
      if (isTabActive && Date.now() - lastActivity > 30_000)
        triggerViolation("30 s inactivity. Assessment auto-submitted.");
    }, 5_000);

    /* listeners */
    window.addEventListener("keydown", keyGuard, true);
    window.addEventListener("contextmenu", ctxGuard, true);
    window.addEventListener("copy",  clipGuard, true);
    window.addEventListener("paste", clipGuard, true);
    window.addEventListener("cut",   clipGuard, true);
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
      window.removeEventListener("copy",  clipGuard, true);
      window.removeEventListener("paste", clipGuard, true);
      window.removeEventListener("cut",   clipGuard, true);
      window.removeEventListener("mousemove", mouseMoveGuard);
      window.removeEventListener("blur", blurGuard);
      window.removeEventListener("mouseleave", mouseLeaveGuard);
      document.removeEventListener("visibilitychange", visibilityGuard);
      document.removeEventListener("fullscreenchange", fullscreenGuard);
    };
  }, [started, stream]);

  /* TIMER */
  useEffect(() => {
    if (!started) return;
    if (timer === 0) handleSubmit();
    const id = setInterval(() => setTimer(t => t - 1), 1_000);
    return () => clearInterval(id);
  }, [started, timer]);

  /* START */
  const handleStart = async () => {
    try {
      const m = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(m);
      await document.documentElement.requestFullscreen?.();
      setStarted(true);
    } catch {
      setError("Camera and microphone access, plus fullscreen permission, are required to start.");
    }
  };

  /* helpers */
  const handleAnswerChange = (id: number, val: string) =>
    setAnswers(prev => ({ ...prev, [id]: val }));

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

  /* UI */
  const q        = dummyQuestions[currentQuestionIndex];
  const total    = dummyQuestions.length;
  const attempted= Object.keys(answers).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 bg-white dark:bg-gray-900 min-h-screen transition-colors">
      {!started ? (
        <>
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
            Secure Assessment
          </h1>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 space-y-4">
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Assessment ID: <strong>{assessmentId}</strong></li>
              <li>Duration: <strong>1 minute</strong></li>
              <li>This assessment opens in <strong>mandatory fullscreen</strong>. Pressing Esc or leaving fullscreen auto-submits.</li>
              <li>Tab/window switching, Alt/⌘-Tab, or window focus loss auto-submits.</li>
              <li>Copy, paste, cut, refresh, F5, Ctrl/⌘-R, and right-click are disabled; attempting them auto-submits.</li>
              <li>No activity for <strong>30 seconds</strong> triggers auto-submission.</li>
              <li>Camera and microphone must remain enabled throughout; disabling them auto-submits.</li>
              <li><strong>Violations result in immediate submission</strong>; unanswered questions receive zero credit.</li>
            </ul>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-4 py-2 rounded border border-red-300 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={handleStart}
                className="px-6 py-2 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Start Assessment
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Time left: {timer}s</h2>
            <button
              onClick={handleSubmit}
              className="px-4 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded transition-colors"
            >
              Submit Now
            </button>
          </div>

          <div className="flex gap-6">
            {/* Question panel */}
            <div className="w-2/3 space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Question {currentQuestionIndex + 1}
                </h3>
                <p className="mb-4 text-gray-800 dark:text-gray-300">{q.question}</p>

                {q.type === "mcq" && (
                  <div className="space-y-2">
                    {q.options!.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={e => handleAnswerChange(q.id, e.target.value)}
                          className="accent-blue-500"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "descriptive" && (
                  <textarea
                    rows={4}
                    value={answers[q.id] || ""}
                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                    onCopy={e => e.preventDefault()}
                    onPaste={e => e.preventDefault()}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  />
                )}

                {q.type === "code" && (
                  <div className="bg-gray-900 p-2 rounded">
                    <Editor
                      height="200px"
                      defaultLanguage="javascript"
                      defaultValue={`function checkPrime(n) {\n  // your code\n}`}
                      theme="vs-dark"
                      options={{ fontSize: 14, minimap: { enabled: false } }}
                      onChange={v => setCode(v ?? "")}
                      value={code}
                    />

                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="number"
                        placeholder="Enter number to test"
                        value={testInput}
                        onChange={e => setTestInput(e.target.value)}
                        className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                      />
                      <button
                        onClick={() => handleRun(q.functionName!)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        ▶ Run Code
                      </button>
                    </div>

                    <pre className="mt-4 bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                      {output}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrent(p => p - 1)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={currentQuestionIndex === total - 1}
                  onClick={() => setCurrent(p => p + 1)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Dashboard */}
            <div className="w-1/3 bg-white dark:bg-gray-800 p-4 rounded shadow-lg border border-gray-200 dark:border-gray-700 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Dashboard</h4>
              <p className="text-gray-700 dark:text-gray-300">Total: {total}</p>
              <p className="text-gray-700 dark:text-gray-300">Attempted: {attempted}</p>
              <p className="text-gray-700 dark:text-gray-300">Pending: {total - attempted}</p>

              <div className="grid grid-cols-4 gap-2">
                {dummyQuestions.map((qq, i) => (
                  <button
                    key={qq.id}
                    onClick={() => setCurrent(i)}
                    className={`px-2 py-1 rounded text-white text-sm ${
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
  );
}
