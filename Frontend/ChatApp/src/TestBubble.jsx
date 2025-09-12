import React, { memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getAvatarColor, formatTime } from "./Utils/MessageUtils";
import TestEditDot from "./TestEditDot"; // Import your TestEditDot component
// import { handleDeleteMessage } from "./TestMessageUtils";

function TestBubble({
  msg,
  isUser, // true if current user sent this message
  activeChat,
  currentUser, // Add currentUser prop to access current user's ID
  handleEditMessage,
  handleUnsendMessage,
}) {
  const senderName =
    isUser || !activeChat
      ? "You"
      : msg.senderName || "Unknown"; // get sender name from API / chatter map

  // Check if current user is the sender of this message
  const isCurrentUserSender = isUser

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-end gap-2 max-w-xs lg:max-w-md ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!isUser && (
          <Avatar className="w-8 h-8">
            <AvatarFallback
              className={`${getAvatarColor(senderName)} text-white text-xs`}
            >
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className={`px-4 py-2 rounded-2xl relative ${
            isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
          }`}
        >
          {!isUser && activeChat?.type === "group" && (
            <div className="text-xs font-semibold mb-1">{senderName}</div>
          )}

          <p
            className="text-sm break-words whitespace-pre-wrap pr-2"
            style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
          >
            {msg.encrypted || msg.text || "..."}
          </p>

          <div
            className={`text-xs mt-1 flex items-center justify-between ${
              isUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            <span>{formatTime(msg.timestamp || Date.now())}</span>
            {msg?.isEdited && (
              <span className="ml-2 text-[10px] italic">(edited)</span>
            )}
          </div>

          {isCurrentUserSender && (
            <div className="absolute top-1 right-1 pl-4">
              <TestEditDot
                onEdit={() => {
                  handleEditMessage(msg)
                }}
                onDelete={() => {
                   handleUnsendMessage(msg);
                  
                }}
                showDetails={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TestBubble);