import React from "react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <img
        src="https://www.change-networks.com/logo.png"
        alt="Change Networks Logo"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="h-6 w-auto"
      />
      <span className="text-sm font-semibold tracking-wide text-gray-800">
        Change Networks
      </span>
    </div>
  );
}
