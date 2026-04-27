import React, { useEffect, useState } from "react";

export default function Flash({ message }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message || (!message.success && !message.error) || !visible) {
    return null;
  }

  const isSuccess = !!message.success;

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-medium animate-slide-in ${
        isSuccess ? "bg-green-600" : "bg-red-600"
      }`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-xl">
        {isSuccess ? "✓" : "✕"}
      </div>
      <p className="text-sm">{message.success || message.error}</p>
    </div>
  );
}
