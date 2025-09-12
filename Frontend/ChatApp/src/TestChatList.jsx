import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, getAvatarColor, formatDate, formatTime } from "./Utils/MessageUtils";
import { Users } from "lucide-react";

const TestChatList = React.memo(function TestChatList({
  chat,
  unreadCount,
  setActiveChat,
  activeChat,
  currentUser
}) {
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (!chat?.Messages || chat.Messages.length === 0) {
      setLastMessage(null);
      return;
    }

    const msg = chat.Messages[chat.Messages.length - 1];
    
    // Find sender name
    const senderName = msg.senderId === currentUser?.id 
      ? "You"
      : chat.chatters.find((u) => u._id === msg.senderId)?.name || "Unknown";

    setLastMessage({
      text: msg.encrypted || msg.message || msg.text || "No message",
      senderId: msg.senderId,
      timestamp: msg.sentAt || msg.timestamp,
      senderName: senderName,
    });
  }, [chat, currentUser]);

  return (
    <div
      onClick={() => setActiveChat(chat)}
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
        activeChat?._id === chat._id ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarFallback
              className={`${getAvatarColor(chat.title)} text-white font-medium`}
            >
              {chat.type === "group" ? <Users className="w-5 h-5" /> : getInitials(chat.title)}
            </AvatarFallback>
          </Avatar>
          {chat.type === "direct" && (
            <div
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                chat.isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          )}
        </div>

        {/* Chat details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 truncate">{chat.title}</h3>
            <span className="text-xs text-gray-500 pr-4">
              {lastMessage ? formatTime(lastMessage.timestamp) : formatDate(chat.date)}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">
            {lastMessage
              ? `${lastMessage.senderId === currentUser?.id ? "You: " : ""}${lastMessage.text}`
              : chat.type === "direct"
              ? "Start a conversation"
              : `Created on ${formatDate(chat.date)}`}
          </p>
        </div>

        {/* Unread count */}
        {unreadCount > 0 && (
          <Badge className="bg-blue-500 text-white rounded-full h-5 w-5 text-xs flex items-center justify-center p-0">
            {unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
});

export default TestChatList;