export default function SebQuitPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="p-6 bg-white shadow-md rounded">
        <h1 className="text-xl font-bold text-red-600">SEB Quit Page</h1>
        <p className="text-gray-700 mt-2">
          Safe Exam Browser should automatically close. If you see this page in a normal browser,
          you can close this tab.
        </p>
      </div>
    </div>
  );
}
