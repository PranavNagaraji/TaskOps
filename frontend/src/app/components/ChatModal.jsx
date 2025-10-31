"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function ChatModal({
  isOpen,
  onClose,
  requestId,
  userId,
  userType, // 'employee' | 'customer'
  userName = "",
  title = "Chat",
  subtitle = "",
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [closed, setClosed] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (!isOpen) return;

    const socket = io(backendUrl, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", {
        requestId,
        userId,
        userType,
        name: userName,
      });
    });

    socket.on("history", (hist = []) => {
      setMessages(hist);
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("chatClosed", () => {
      setClosed(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setClosed(false);
      setMessages([]);
      setInput("");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, requestId, userId, userType, userName, backendUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = input.trim();
    if (!text || !socketRef.current || closed) return;
    const payload = {
      requestId,
      text,
      userId,
      userType,
      name: userName,
      ts: Date.now(),
    };
    socketRef.current.emit("message", payload);
    setInput("");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded border hover:bg-muted"
          >
            Close
          </button>
        </div>

        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">No messages yet.</div>
          ) : (
            messages.map((m, idx) => {
              const mine = String(m.senderId) === String(userId) && m.senderType === userType;
              return (
                <div key={idx} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow ${mine ? "bg-blue-600 text-white" : "bg-white border"}`}>
                    {!mine && (
                      <div className="text-[10px] text-muted-foreground mb-0.5">{m.name || m.senderType}</div>
                    )}
                    <div>{m.text}</div>
                    <div className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-muted-foreground"}`}>
                      {new Date(m.ts).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder={closed ? "Chat closed (request completed)" : "Type a message"}
            disabled={closed}
            className="flex-1 border border-border rounded-md px-3 py-2 text-sm disabled:bg-muted"
          />
          <button
            onClick={sendMessage}
            disabled={closed || input.trim().length === 0}
            className="px-3 py-2 rounded-md text-white text-sm disabled:opacity-60"
            style={{ backgroundColor: "#2563eb" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
