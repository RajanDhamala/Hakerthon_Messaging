import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useSocket from "./Zustand/useSocket";
import TestChatList from "./TestChatList";
import TestBubble from "./TestBubble";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateGroup from "./CreateGroup";

import { Users, MessageCircle, Send, Search, UserPlus, Menu, X, Video, Phone } from "lucide-react";

// Helper functions (keep existing ones)
const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
};

const getAvatarColor = (name) => {
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
    "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
  ];
  if (!name) return colors[0];
  const hash = name.split("").reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function TestChat() {
  const socket = useSocket((state) => state.socket);
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();

  // State
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("direct");
  const [editingMessage, setEditingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  
  // New state to maintain messages separately for each chat
  const [chatMessages, setChatMessages] = useState({});
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isCurrentlyTypingRef = useRef(false);

  // Function to get messages for current active chat
  const getCurrentChatMessages = useCallback(() => {
    if (!activeChat) return [];
    const chatKey = `${activeChat.type}_${activeChat._id}`;
    return chatMessages[chatKey] || activeChat.messages || [];
  }, [activeChat, chatMessages]);

  // Function to update messages for a specific chat
  const updateChatMessages = useCallback((chatId, chatType, newMessages) => {
    const chatKey = `${chatType}_${chatId}`;
    setChatMessages(prev => ({
      ...prev,
      [chatKey]: newMessages
    }));
  }, []);

  // Function to add message to specific chat
  const addMessageToChat = useCallback((chatId, chatType, newMessage) => {
    const chatKey = `${chatType}_${chatId}`;
    setChatMessages(prev => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), newMessage]
    }));
  }, []);

  // Fetch Group Messages when selecting a group
  const fetchGroupMessages = useCallback(async (groupId) => {
    if (!currentUser?.id || !groupId) return [];
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}group/messages/${groupId}`,
        { headers: { Authorization: `Bearer ${currentUser.id}` } }
      );
      return res.data?.data || [];
    } catch (error) {
      console.error("Error fetching group messages:", error);
      return [];
    }
  }, [currentUser?.id]);

  // Handle message operations
  const handleDeleteMessage = (msg) => {
    console.log("Delete message:", msg);
    
    if (activeChat.type === "group") {
      socket.emit("delete-group-message", {
        groupId: activeChat._id,
        messageId: msg.messageId || msg.id,
        sender: currentUser.id,
      });
    } else {
      socket.emit("delete-message", {
        messageId: msg.messageId || msg.id,
        receiver: activeChat.chatters.find(chatter => chatter._id !== currentUser.id)?._id,
        chatId: msg.chatId || activeChat._id,
      });
    }

    // Update local messages state
    const currentMessages = getCurrentChatMessages();
    const updatedMessages = currentMessages.filter((m) => m.messageId !== (msg.messageId || msg.id));
    updateChatMessages(activeChat._id, activeChat.type, updatedMessages);

    // Update TanStack cache
    const queryKey = activeChat.type === "group" ? ["group-chats", currentUser.id] : ["chats", currentUser.id];
    queryClient.setQueryData(queryKey, (old = []) =>
      old.map((chat) =>
        chat._id === activeChat._id
          ? {
              ...chat,
              messages: updatedMessages,
            }
          : chat
      )
    );
  };

  const handleEditMessage = (msg) => {
    setEditingMessage({
      ...msg,
      messageId: msg.messageId || msg.id,
      text: msg.text || msg.encrypted || msg.message,
    });
  };

  const submitEdit = () => {
    if (!editingMessage?.text.trim()) return;

    if (activeChat.type === "group") {
      socket.emit("edit-group-message", {
        groupId: activeChat._id,
        messageId: editingMessage.messageId,
        encrynewMessage: editingMessage.text.trim(),
      });
    } else {
      socket.emit("edit-message", {
        messageId: editingMessage.messageId,
        chatId: activeChat._id,
        receiver: activeChat.chatters.find(chatter => chatter._id !== currentUser.id)?._id,
        encrynewMessage: editingMessage.text.trim(),
      });
    }

    // Update local messages state
    const currentMessages = getCurrentChatMessages();
    const updatedMessages = currentMessages.map((m) =>
      m.messageId === editingMessage.messageId
        ? { ...m, text: editingMessage.text.trim(), isEdited: true }
        : m
    );
    updateChatMessages(activeChat._id, activeChat.type, updatedMessages);

    // Update TanStack cache
    const queryKey = activeChat.type === "group" ? ["group-chats", currentUser.id] : ["chats", currentUser.id];
    queryClient.setQueryData(queryKey, (old = []) =>
      old.map((chat) =>
        chat._id === activeChat._id
          ? {
              ...chat,
              messages: updatedMessages,
            }
          : chat
      )
    );
    setEditingMessage(null);
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // Transform API data to component format
  const transformChatData = useCallback((apiChats, currentUserId) => {
    if (!apiChats || !currentUserId) return [];
    
    return apiChats.map(chat => {
      const otherChatters = chat.chatters.filter(chatter => chatter._id !== currentUserId);
      const isGroup = chat.chatters.length > 2;
      
      const transformedChat = {
        ...chat,
        title: isGroup 
          ? `Group Chat (${chat.chatters.length} members)` 
          : otherChatters[0]?.name || "Unknown User",
        type: isGroup ? "group" : "direct",
        
        messages: (chat.messages || []).map(msg => ({
          messageId: msg.messageId || msg._id || `msg_${Date.now()}_${Math.random()}`,
          senderId: msg.senderId || msg.sender,
          senderName: msg.senderName,
          text: msg.text || msg.encrypted || msg.message || "",
          chatId: msg.chatId || chat._id,
          timestamp: msg.timestamp || msg.sentAt,
          isSeen: msg.isSeen || false,
          isEdited: msg.isEdited || false,
          type: msg.type || "text"
        })),
        
        participantCount: chat.chatters.length,
        isOnline: false,
        date: chat.createdAt
      };

      // Store messages in our local state
      if (transformedChat.messages && transformedChat.messages.length > 0) {
        const chatKey = `${transformedChat.type}_${transformedChat._id}`;
        setChatMessages(prev => ({
          ...prev,
          [chatKey]: transformedChat.messages
        }));
      }

      return transformedChat;
    });
  }, []);

  // Transform group data from API
  const transformGroupData = useCallback((groupChats) => {
    if (!groupChats) return [];
    
    return groupChats.map(group => {
      const transformedGroup = {
        _id: group._id,
        title: group.name,
        type: "group",
        lastMessage: group.lastMessage ? {
          text: group.lastMessage.message,
          timestamp: group.lastMessage.timestamps,
          messageId: group.lastMessage.messageId
        } : null,
        messages: [], // Will be loaded separately
        chatters: group.members || [],
        participantCount: group.members?.length || 0,
        isOnline: false,
        date: group.createdAt || new Date().toISOString()
      };

      return transformedGroup;
    });
  }, []);

  // Fetch Direct Chats
  const fetchChats = useCallback(async () => {
    if (!currentUser?.id) return [];
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}chat/current/${currentUser.id}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${currentUser.id}` },
      });
      
      const chatData = res.data?.data;
      return Array.isArray(chatData) ? chatData : [chatData];
    } catch (error) {
      console.error("Error fetching chats:", error);
      return [];
    }
  }, [currentUser?.id]);

  // Fetch Group Chats
  const fetchGroupData = useCallback(async () => {
    if (!currentUser?.id) return [];
    try {
      const req = await axios.get(
        `${import.meta.env.VITE_BASE_URL}group/joined`,
        { headers: { Authorization: `Bearer ${currentUser.id}` } }
      );
      return req.data.data || [];
    } catch (error) {
      console.error("Error fetching groups:", error);
      return [];
    }
  }, [currentUser?.id]);

  const { data: rawChats = [], isLoading } = useQuery({
    queryKey: ["chats", currentUser?.id],
    queryFn: fetchChats,
    enabled: !!currentUser?.id,
  });

  const { data: rawGroupChats = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ["group-chats", currentUser?.id],
    queryFn: fetchGroupData,
    enabled: !!currentUser?.id,
  });

  // Transform data using useMemo
  const directChats = useMemo(() => {
    return transformChatData(rawChats, currentUser?.id);
  }, [rawChats, currentUser?.id, transformChatData]);

  const groupChats = useMemo(() => {
    return transformGroupData(rawGroupChats);
  }, [rawGroupChats, transformGroupData]);

  // Combine all chats
  const allChats = useMemo(() => {
    return [...directChats, ...groupChats];
  }, [directChats, groupChats]);

  // Filter chats with useMemo
  const { directData, groupData, filteredChats } = useMemo(() => {
    const direct = directChats.filter(chat => 
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const group = groupChats.filter(chat => 
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filtered = activeTab === "groups" ? group : direct;
    
    return {
      directData: direct,
      groupData: group,
      filteredChats: filtered
    };
  }, [directChats, groupChats, activeTab, searchQuery]);

  // Calculate unread counts using useMemo
  const unreadCounts = useMemo(() => {
    const counts = {};
    allChats.forEach(chat => {
      const chatKey = `${chat.type}_${chat._id}`;
      const messages = chatMessages[chatKey] || chat.messages || [];
      const unreadMessages = messages.filter(
        msg => msg.senderId !== currentUser?.id && !msg.isSeen
      );
      counts[chat._id] = unreadMessages.length;
    });
    return counts;
  }, [allChats, currentUser?.id, chatMessages]);

  const handleVideoCall = useCallback(() => {
    if (!activeChat || activeChat.type === "group") return;
    console.log("Starting video call with:", activeChat.title);
    alert(`Starting video call with ${activeChat.title}`);
  }, [activeChat]);

  const emitTypingStatus = useCallback((isTypingStatus) => {
    if (!socket || !activeChat || !currentUser?.id) return;
    
    if (isCurrentlyTypingRef.current !== isTypingStatus) {
      if (activeChat.type === "group") {
        socket.emit("group-typing", {
          groupId: activeChat._id,
          isTyping: isTypingStatus,
          sender: currentUser.id,
          senderName: currentUser.fullName || currentUser.firstName
        });
      } else {
        const receiver = activeChat.chatters.find(chatter => chatter._id !== currentUser.id)?._id;
        if (receiver) {
          socket.emit("Is-Typing", {
            isTyping: isTypingStatus,
            sender: currentUser.id,
            receiver: receiver
          });
        }
      }
      isCurrentlyTypingRef.current = isTypingStatus;
    }
  }, [socket, activeChat, currentUser?.id]);

  // Enhanced Socket effects with better message handling
  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    // Direct message handlers
    const handleReceiveMessage = (msg) => {
      console.log("Received direct message:", msg);
      
      const normalizedMsg = {
        messageId: msg.messageId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.text,
        chatId: msg.chatId,
        timestamp: msg.timestamp,
        type: msg.type || "text",
        isSeen: msg.isSeen || false,
        isEdited: msg.isEdited || false
      };
      
      // Add to local messages state
      addMessageToChat(msg.chatId, "direct", normalizedMsg);

      // Update TanStack cache
      queryClient.setQueryData(["chats", currentUser.id], (old = []) =>
        old.map((chat) =>
          chat._id === msg.chatId 
            ? { ...chat, messages: [...(chat.messages || []), normalizedMsg] }
            : chat
        )
      );

      scrollToBottom();
    };

    // Group message handlers
    const handleNewGroupMessage = (data) => {
      console.log("Received group message:", data);
      
      const normalizedMsg = {
        messageId: data.messageId,
        senderId: data.sender,
        senderName: data.senderName || "Unknown",
        text: data.encrynewMessage,
        chatId: data.groupId,
        timestamp: data.timestamps,
        type: "text",
        isSeen: false,
        isEdited: false
      };
      
      // Add to local messages state
      addMessageToChat(data.groupId, "group", normalizedMsg);

      // Update group chats cache
      queryClient.setQueryData(["group-chats", currentUser.id], (old = []) =>
        old.map((chat) =>
          chat._id === data.groupId 
            ? { 
                ...chat, 
                messages: [...(chat.messages || []), normalizedMsg],
                lastMessage: {
                  text: data.encrynewMessage,
                  timestamp: data.timestamps,
                  messageId: data.messageId
                }
              }
            : chat
        )
      );

      scrollToBottom();
    };

    // Message edit handlers
    const handleEditedMessage = (data) => {
      console.log("Direct message edited:", data);
      
      const chatKey = `direct_${data.chatId}`;
      setChatMessages(prev => ({
        ...prev,
        [chatKey]: (prev[chatKey] || []).map((msg) =>
          msg.messageId === data.messageId
            ? { ...msg, text: data.newMessage, isEdited: true }
            : msg
        )
      }));

      queryClient.setQueryData(["chats", currentUser.id], (old = []) =>
        old.map((chat) =>
          chat._id === data.chatId
            ? {
                ...chat,
                messages: chat.messages.map((msg) =>
                  msg.messageId === data.messageId
                    ? { ...msg, text: data.newMessage, isEdited: true }
                    : msg
                ),
              }
            : chat
        )
      );
    };

    const handleEditedGroupMessage = (data) => {
      console.log("Group message edited:", data);
      
      const chatKey = `group_${data.groupId}`;
      setChatMessages(prev => ({
        ...prev,
        [chatKey]: (prev[chatKey] || []).map((msg) =>
          msg.messageId === data.messageId
            ? { ...msg, text: data.encrynewMessage, isEdited: true }
            : msg
        )
      }));

      queryClient.setQueryData(["group-chats", currentUser.id], (old = []) =>
        old.map((chat) =>
          chat._id === data.groupId
            ? {
                ...chat,
                messages: (chat.messages || []).map((msg) =>
                  msg.messageId === data.messageId
                    ? { ...msg, text: data.newMessage, isEdited: true }
                    : msg
                ),
              }
            : chat
        )
      );
    };

    // Message delete handlers
    const handleDeletedMessage = (data) => {
      console.log("Direct message deleted:", data);
      
      const chatKey = `direct_${data.chatId}`;
      setChatMessages(prev => ({
        ...prev,
        [chatKey]: (prev[chatKey] || []).filter(
          (msg) => msg.messageId !== data.messageId
        )
      }));

      queryClient.setQueryData(["chats", currentUser.id], (old = []) =>
        old.map((chat) =>
          chat._id === data.chatId
            ? {
                ...chat,
                messages: chat.messages.filter(
                  (msg) => msg.messageId !== data.messageId
                ),
              }
            : chat
        )
      );
    };

    const handleDeletedGroupMessage = (data) => {
      console.log("Group message deleted:", data);
      
      const chatKey = `group_${data.groupId}`;
      setChatMessages(prev => ({
        ...prev,
        [chatKey]: (prev[chatKey] || []).filter(
          (msg) => msg.messageId !== data.messageId
        )
      }));

      queryClient.setQueryData(["group-chats", currentUser.id], (old = []) =>
        old.map((chat) =>
          chat._id === data.groupId
            ? {
                ...chat,
                messages: (chat.messages || []).filter(
                  (msg) => msg.messageId !== data.messageId
                ),
              }
            : chat
        )
      );
    };

    const handleTypingIndicator = (data) => {
      console.log("Typing indicator:", data);
      
      if (data.sender !== currentUser.id && activeChat) {
        const senderInfo = activeChat.chatters?.find(chatter => chatter._id === data.sender);
        const senderName = senderInfo?.name || data.senderName || "Someone";
        
        setIsTyping(data.isTyping);
        setTypingUser(data.isTyping ? senderName : "");

        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setTypingUser("");
          }, 3000);
        }
      }
    };

    // Register all socket listeners
    socket.on("Recieve-peer2peer", handleReceiveMessage);
    socket.on("edited-message", handleEditedMessage);
    socket.on("deleted-message", handleDeletedMessage);
    socket.on("User-Typing", handleTypingIndicator);
    
    // Group message listeners
    socket.on("new-group-message", handleNewGroupMessage);
    socket.on("edited-group-message", handleEditedGroupMessage);
    socket.on("deleted-group-message", handleDeletedGroupMessage);

    return () => {
      socket.off("Recieve-peer2peer", handleReceiveMessage);
      socket.off("edited-message", handleEditedMessage);
      socket.off("deleted-message", handleDeletedMessage);
      socket.off("User-Typing", handleTypingIndicator);
      socket.off("new-group-message", handleNewGroupMessage);
      socket.off("edited-group-message", handleEditedGroupMessage);
      socket.off("deleted-group-message", handleDeletedGroupMessage);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, currentUser?.id, activeChat, queryClient, scrollToBottom, addMessageToChat]);

  // Handle typing with proper debouncing
  const handleTyping = useCallback((e) => {
    setMessage(e.target.value);

    if (e.target.value.length > 0 && !isCurrentlyTypingRef.current) {
      emitTypingStatus(true);
    }
    
    if (e.target.value.length === 0 && isCurrentlyTypingRef.current) {
      emitTypingStatus(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isCurrentlyTypingRef.current) {
      typingTimeoutRef.current = setTimeout(() => {
        emitTypingStatus(false);
      }, 2000);
    }
  }, [emitTypingStatus]);

  // Enhanced Send message
  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat || !socket) return;

    if (isCurrentlyTypingRef.current) {
      emitTypingStatus(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const messageId = `msg_${Date.now()}_${Math.random()}`;
    const timestamp = new Date().toISOString();

    const newMsg = {
      messageId,
      senderId: currentUser.id,
      senderName: currentUser.fullName || currentUser.firstName,
      text: message.trim(),
      chatId: activeChat._id,
      timestamp,
      type: "text",
      isSeen: false,
      isEdited: false
    };

    // Add to local messages immediately
    addMessageToChat(activeChat._id, activeChat.type, newMsg);

    if (activeChat.type === "group") {
      socket.emit("send-group-message", {
        groupId: activeChat._id,
        messageId,
        timestamps: timestamp,
        sender: currentUser.id,
        senderName: currentUser.fullName || currentUser.firstName,
        encrynewMessage: message.trim(),
      });

      // Update cache
      queryClient.setQueryData(["group-chats", currentUser.id], (old = []) =>
        old.map((chat) =>
          chat._id === activeChat._id
            ? { 
                ...chat, 
                messages: [...(chat.messages || []), newMsg],
                lastMessage: {
                  text: message.trim(),
                  timestamp,
                  messageId
                }
              }
            : chat
        )
      );
      
    } else if (activeChat.type === "direct") {
      socket.emit("Send-peer2peer", {
        messageId,
        timestamps: timestamp,
        sender: currentUser.id,
        receiver: activeChat.chatters.find(chatter => chatter._id !== currentUser.id)?._id,
        encrypted: message.trim(),
        chatId: activeChat._id
      });

      // Update cache
      queryClient.setQueryData(["chats", currentUser.id], (old = []) =>
        old.map((chat) =>
          chat._id === activeChat._id
            ? { ...chat, messages: [...chat.messages, newMsg] }
            : chat
        )
      );
    }
    
    setMessage("");
    scrollToBottom();
  }, [message, activeChat, socket, currentUser, scrollToBottom, queryClient, emitTypingStatus, addMessageToChat]);

  // Clear typing when changing chats
  useEffect(() => {
    if (isCurrentlyTypingRef.current) {
      emitTypingStatus(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    setTypingUser("");
    isCurrentlyTypingRef.current = false;
  }, [activeChat?._id, emitTypingStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isCurrentlyTypingRef.current && socket && activeChat && currentUser?.id) {
        if (activeChat.type === "group") {
          socket.emit("group-typing", {
            groupId: activeChat._id,
            isTyping: false,
            sender: currentUser.id
          });
        } else {
          const receiver = activeChat.chatters.find(chatter => chatter._id !== currentUser.id)?._id;
          if (receiver) {
            socket.emit("Is-Typing", {
              isTyping: false,
              sender: currentUser.id,
              receiver: receiver
            });
          }
        }
      }
    };
  }, [socket, activeChat, currentUser?.id]);

  // Unread count helpers
  const getTotalUnreadCount = useMemo(() => 
    Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
  , [unreadCounts]);

  const getTabUnreadCount = useCallback((tab) => {
    const chats = tab === "groups" ? groupData : directData;
    return chats.reduce((sum, chat) => sum + (unreadCounts[chat._id] || 0), 0);
  }, [groupData, directData, unreadCounts]);

  // Enhanced Handle chat selection - Load group messages and maintain state
  const handleChatSelect = useCallback(async (chat) => {
    console.log("Selecting chat:", chat.type, chat._id);
    
    setActiveChat(chat);
    setMobileSidebarOpen(false);

    // Check if we already have messages for this chat in our local state
    const chatKey = `${chat.type}_${chat._id}`;
    const existingMessages = chatMessages[chatKey];

    if (chat.type === "group" && (!existingMessages || existingMessages.length === 0)) {
      try {
        console.log("Fetching group messages for:", chat._id);
        const groupMessages = await fetchGroupMessages(chat._id);
        const transformedMessages = groupMessages.map(msg => ({
          messageId: msg.messageId || msg._id,
          senderId: msg.senderId || msg.sender,
          senderName: msg.senderName || "Unknown",
          text: msg.text || msg.message || msg.encrypted,
          chatId: chat._id,
          timestamp: msg.timestamp || msg.sentAt,
          isSeen: msg.isSeen || false,
          isEdited: msg.isEdited || false,
          type: msg.type || "text"
        }));

        console.log("Transformed group messages:", transformedMessages);

        // Update local messages state
        updateChatMessages(chat._id, chat.type, transformedMessages);

        // Update cache
        queryClient.setQueryData(["group-chats", currentUser.id], (old = []) =>
          old.map((groupChat) =>
            groupChat._id === chat._id
              ? { ...groupChat, messages: transformedMessages }
              : groupChat
          )
        );

        scrollToBottom();
      } catch (error) {
        console.error("Failed to load group messages:", error);
      }
    } else if (existingMessages) {
      console.log("Using existing messages:", existingMessages.length);
      scrollToBottom();
    }
  }, [fetchGroupMessages, queryClient, currentUser?.id, scrollToBottom, chatMessages, updateChatMessages]);

  if (isLoading || isLoadingGroups) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gray-50 md:ml-14">
        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <CreateGroup onClose={() => setShowCreateGroup(false)} />
          </div>
        )}

        {/* Sidebar - Keep your existing sidebar JSX */}
        <div
          className={`${
            isMobileSidebarOpen ? "block" : "hidden"
          } md:block w-full md:w-80 bg-white border-r border-gray-200 flex flex-col z-30`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                  {getTotalUnreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                      {getTotalUnreadCount}
                    </Badge>
                  )}
                </div>
                <h1 className="text-lg font-semibold">Messages</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => setShowCreateGroup(true)}>
                  <UserPlus className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations"
                className="pl-10 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="direct" className="relative">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Direct ({directData.length})
                  {getTabUnreadCount("direct") > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                      {getTabUnreadCount("direct")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="groups" className="relative">
                  <Users className="w-4 h-4 mr-2" />
                  Groups ({groupData.length})
                  {getTabUnreadCount("groups") > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                      {getTabUnreadCount("groups")}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? "No conversations found" : (activeTab === "groups" ? "No groups available" : "No direct chats")}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    activeChat?._id === chat._id ? "bg-blue-50 border-blue-200" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className={`${getAvatarColor(chat.title)} text-white font-medium`}>
                          {chat.type === "group" ? <Users className="w-6 h-6" /> : getInitials(chat.title)}
                        </AvatarFallback>
                      </Avatar>
                      {chat.type === "direct" && (
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          chat.isOnline ? "bg-green-500" : "bg-gray-400"
                        }`} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{chat.title}</h3>
                        <div className="flex items-center space-x-2">
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatTime(chat.lastMessage.timestamp)}
                            </span>
                          )}
                          {unreadCounts[chat._id] > 0 && (
                            <Badge className="h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                              {unreadCounts[chat._id]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage?.text || (chat.type === "group" ? "Group created" : "Start a conversation")}
                        </p>
                        {chat.type === "group" && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Users className="w-3 h-3 mr-1" />
                            {chat.participantCount || 0}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Mobile Header */}
          <div className="md:hidden p-4 border-b border-gray-200 bg-white flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">{activeChat ? activeChat.title : "Chat"}</h1>
            <div className="w-10" />
          </div>

          {activeChat ? (
            <>
              {/* Chat Header - Desktop */}
              <div className="hidden md:flex p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${getAvatarColor(activeChat.title)} text-white font-medium`}>
                          {activeChat.type === "group" ? <Users className="w-5 h-5" /> : getInitials(activeChat.title)}
                        </AvatarFallback>
                      </Avatar>
                      {activeChat.type === "direct" && (
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            activeChat.isOnline ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">{activeChat.title}</h2>
                      <div className="flex items-center text-xs text-gray-500">
                        {isTyping ? (
                          <span className="text-green-500 font-medium">
                            {typingUser} is typing...
                          </span>
                        ) : activeChat.type === "group" ? (
                          <span>{activeChat.participantCount || 0} members</span>
                        ) : (
                          <span className={activeChat.isOnline ? "text-green-500" : "text-gray-500"}>
                            {activeChat.isOnline ? "Online" : "Offline"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Video Call Button - Only for Direct Chats */}
                  {activeChat.type === "direct" && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleVideoCall}
                        className="hover:bg-gray-100"
                      >
                        <Video className="w-5 h-5 text-gray-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-white">
                <div className="space-y-4 pb-4">
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded">
                      Debug: {activeChat.type} - {activeChat._id} - Messages: {getCurrentChatMessages().length}
                    </div>
                  )}
                  
                  {getCurrentChatMessages().map((msg) => {
                    const isUser = msg.senderId === currentUser?.id;
                    
                    return (
                      <React.Fragment key={msg.messageId}>
                        <TestBubble
                          msg={msg}
                          isUser={isUser}
                          activeChat={activeChat}
                          handleUnsendMessage={handleDeleteMessage}
                          handleEditMessage={handleEditMessage}
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Edit Message Input */}
                  {editingMessage && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editingMessage.text}
                        onChange={(e) =>
                          setEditingMessage({ ...editingMessage, text: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            submitEdit();
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex justify-end mt-1 space-x-2">
                        <button
                          className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
                          onClick={() => submitEdit()}
                        >
                          Save
                        </button>
                        <button
                          className="px-3 py-1 text-sm rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
                          onClick={() => setEditingMessage(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-end gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={`${getAvatarColor(typingUser)} text-white text-xs`}>
                            {getInitials(typingUser)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Input
                      value={message}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="rounded-full border-gray-300"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-blue-500 hover:bg-blue-600 h-10 w-10"
                    disabled={!message.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a conversation from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}