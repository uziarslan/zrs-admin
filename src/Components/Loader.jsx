import React from "react";

export default function Loader() {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-white/30 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
  );
}
