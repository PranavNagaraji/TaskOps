"use client";
import { useState } from "react";
import ChatModal from "./ChatModal.jsx";

export default function ChatButton({
  requestId,
  userId,
  userType, // 'customer' | 'employee'
  userName,
  label = "Open Chat",
  title = "Chat",
  subtitle = "",
  className = "px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {label}
      </button>
      <ChatModal
        isOpen={open}
        onClose={() => setOpen(false)}
        requestId={requestId}
        userId={userId}
        userType={userType}
        userName={userName}
        title={title}
        subtitle={subtitle}
      />
    </>
  );
}
