import { useState, useEffect, useRef, useCallback } from "react"
import { MessageCircle,Users,Send,Menu,X,Search,Trash2,Phone,Video,MoreHorizontal,Settings,UserPlus,Circle,CheckCircle2,Pencil} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useSocket from "./Zustand/useSocket"
import { useNavigate } from "react-router-dom"
import { encryptMessage,decryptMessage } from "./Utils/MessageUtils"
import { useUser } from "@clerk/clerk-react"
import ChatBubble from "./Utils/ChatBubble"
import React from "react"
import { getInitials,getAvatarColor,formatDate,formatTime } from "./Utils/MessageUtils";
import ChatListItem from "./Utils/ChatListItem"
import useKeyStore from "./Zustand/keyStore"
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null)

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay)
    },
    [callback, delay],
  )
}

function ChatMain() {
  const navigate=useNavigate()
  const queryClient = useQueryClient()
  const CurrentUser = useUser().user
  const [activeChat, setActiveChat] = useState(null)
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState("")
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("groups")
  const [searchQuery, setSearchQuery] = useState("")
  const [unreadCounts, setUnreadCounts] = useState({})
  const [editingMessage,seteditingMessage]=useState(null)
  const privateKey=useKeyStore((state)=>state.privateKey)
  const publicKey=useKeyStore((state)=>state.publicKey)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const socket = useSocket((state) => state.socket)
  const setVideoCall = useSocket((state) => state.setVideoCall)
  const VideoCall = useSocket((state) => state.VideoCall)

  const Scroll2Button = () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
  }

  // const encryptMessage=(message)=>{
  //   return CryptoJS.AES.encrypt(message, import.meta,env.VITE_SECRET_KEY).toString();
  // }

  // const decryptMessage=(message)=>{
  //   const bytes = CryptoJS.AES.decrypt(cipherText, import.meta.env.VITE_SECRET_KEY);
  // return bytes.toString(CryptoJS.enc.Utf8);
  // }

const submitEdit = async (msg, msgid) => {
  if(activeChat.type=="group"){
    socket.emit("edit-group-message",({
      "messageId":msg.id,
      "newMessage":msg.text,
      "receiver":activeChat._id
    }))
    queryClient.setQueryData(["ChatEvents"], (oldData) => {
      if (!oldData) return oldData;

      return oldData.map((group) => {
        if (group._id === activeChat._id) {
          return {
            ...group,
            Messages: group.Messages.map((message) =>
              message.id === msgid
                ? { ...message, message: msg.text }
                : message
            ),
          };
        }
        return group;
      });
    });
    setActiveChat((prevActiveChat) => ({
  ...prevActiveChat,
  Messages: prevActiveChat.Messages.map((m) =>
    m.id === msgid ? { ...m, message: msg.text } : m
  ),
}));

    seteditingMessage(null);
  }else{
    const encrynewMessage=await encryptMessage(msg.text,activeChat.publicKey,privateKey)
    console.log("encrypted Message:\n",encrynewMessage)
    socket.emit("edit-message",({
      "messageId":msg.id,
      encrynewMessage,
      "receiver":activeChat._id
    }))
    queryClient.setQueryData(["DirectChats"], (oldData) => {
    if (!oldData) return oldData;

    return oldData.map((chat) => {
      if (chat._id === activeChat._id) {
        return {
          ...chat,
          Messages: chat.Messages.map((m) =>
            m.id === msgid ? { ...m, message: msg.text } : m
          ),
        };
      }
      return chat;
    });
  });

  setActiveChat((prev) => ({
    ...prev,
    Messages: prev.Messages.map((m) =>
      m.id === msgid ? { ...m, message: msg.text} : m
    ),
  }));
  }
  seteditingMessage(null)
};


  const handeleditMessage=(msg)=>{
    console.log(msg,"mesage")
    seteditingMessage({"id":msg.id,"text":msg.message})
    
  }

  // Fetch group chats from backend API
  const FetchGroupChats = async () => {
    try {
      // Clerk user object uses 'id' for the unique identifier
      const userId = CurrentUser?.id;
      if (!userId) return [];
      // Fetch user's groups
      const res = await axios.get(`http://localhost:8000/group/current/${userId}`, {
        withCredentials: true,
       headers: { Authorization: `Bearer ${userId}` },
      });
      const groups = res.data?.groups || [];
      // For each group, fetch last 10 messages
      const groupChats = await Promise.all(groups.map(async (group) => {
        const msgRes = await axios.get(`http://localhost:8000/group/messages/${group._id}`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${userId}` },
        });
        return {
          _id: group._id,
          title: group.name,
          Messages: msgRes.data?.messages || [],
          type: "group",
          participantCount: group.members?.length || 0,
          publicKey: group.publicKey,
        };
      }));
      return groupChats;
    } catch (error) {
      console.error("Error fetching group chats:", error);
      return [];
    }
  };

  // Fetch peer-to-peer chats from backend API
  const FetchDirectChats = async () => {
    try {
      // Clerk user object uses 'id' for the unique identifier
      const userId = CurrentUser?.id;
      if (!userId) return [];
      // Fetch all chats for user
      const res = await axios.get(`http://localhost:8000/chat/current/${userId}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${userId}` },
      });
      const chats = res.data?.chats || [];
     
      const directChats = await Promise.all(chats.map(async (chat) => {
        const msgRes = await axios.get(`http://localhost:8000/chat/peer/${chat._id}`, {
          withCredentials: true,
         headers: { Authorization: `Bearer ${userId}` },
        });
        return {
          _id: chat._id,
          title: chat.name,
          Messages: msgRes.data?.messages || [],
          type: "direct",
          isOnline: chat.isOnline,
          publicKey: chat.publicKey,
        };
      }));
      return directChats;
    } catch (error) {
      console.error("Error fetching direct chats:", error);
      return [];
    }
  };

  // Use React Query to fetch group and direct chats
  const { data: groupData, refetch: refetchGroupChats } = useQuery({
    queryKey: ["ChatEvents"],
    queryFn: FetchGroupChats,
    
  });

  const { data: directData, refetch: refetchDirectChats } = useQuery({
    queryKey: ["DirectChats"],
    queryFn: FetchDirectChats,
   
  });

  const handleVideoCalling = (receiverId,name) => {
    setVideoCall({
      receiverId: receiverId,
      isActive: true,
      callType: "video",
      reciverName:name,
    })
    console.log(receiverId,name)
   navigate(`/call`)
  }

  const debouncedTyping = useDebounce((chatId, userName, isGroup) => {
    if (socket && chatId) {
      if (isGroup) {
        socket.emit("Is-Typing", {
          group: chatId,
          sender: userName,
          isTyping: true,
        })
      } else {
        socket.emit("Direct-Typing", {
          chatId: chatId,
          sender: userName,
          isTyping: true,
        })
      }
    }
  }, 300)

  useEffect(() => {
    if (!socket) return
    socket.on("Group-Message", (data) => {
      const newMessage = {
        id: data.MessageId,
        senderId: data.senderId || `user_${data.sender}`,
        senderName: data.sender,
        message: data.message,
        timestamp: Date.now(),
        group: data.group,
        readBy: data.readBy || [],
      }
      console.log("Received group message:", data)

      queryClient.setQueryData(["ChatEvents"], (oldData) => {
        if (!oldData) return oldData
        let updated = false
        const newData = oldData.map((group) => {
          if (group._id === newMessage.group) {
            const exists = group.Messages.some((msg) => msg.id === newMessage.id)
            if (!exists) {
              updated = true
              return {
                ...group,
                Messages: [...group.Messages, newMessage],
              }
            }
          }
          return group
        })

        // Update activeChat if it's the same group
        if (activeChat && activeChat._id === newMessage.group && activeChat.type === "group") {
          const updatedEvent = newData.find((group) => group._id === activeChat._id)
            Scroll2Button()
          if (updatedEvent) {
            setActiveChat({ ...updatedEvent, type: "group" })
          }
        } else {
          setUnreadCounts((prev) => ({
            ...prev,
            [newMessage.group]: (prev[newMessage.group] || 0) + 1,
          }))
  }

        return updated ? newData : oldData
      })
    
    })

    // Direct message handling
    socket.on("Recieve-peer2peer", async({sender, timestamps, messageId, chatId, senderId,encrypted }) => {
      console.log("Message Recieved:\n",encrypted)
         const newMessage = {
        id: messageId,
        senderId: senderId || `user_${sender}`,
        senderName: sender,
        message: encrypted,
        timestamp: timestamps || Date.now(),
      }

      queryClient.setQueryData(["DirectChats"], (oldData) => {
        if (!oldData) return oldData
        let updated = false
        const newData = oldData.map((chat) => {
          // Match by chatId (receiver ID) or sender name for direct chats
          if (chat._id === chatId || chat.title === sender) {
            const exists = chat.Messages?.some((msg) => msg.id === newMessage.id)
            if (!exists) {
              updated = true
              return {
                ...chat,
                Messages: [...(chat.Messages || []), newMessage],
              }
            }
          }
          return chat
        })

        // Update activeChat if it's the same direct chat
        if (activeChat && (activeChat._id === chatId || activeChat.title === sender) && activeChat.type === "direct") {
          const updatedChat = newData.find((chat) => chat._id === activeChat._id || chat.title === sender)
          Scroll2Button()
          if (updatedChat) {
            setActiveChat({ ...updatedChat, type: "direct" })
          }
        } else {
          // Update unread count if not in active chat
          const targetChatId = chatId || newData.find((chat) => chat.title === sender)?._id
          if (targetChatId) {
            setUnreadCounts((prev) => ({
              ...prev,
              [targetChatId]: (prev[targetChatId] || 0) + 1,
            }))
          }
        }

        return updated ? newData : oldData
      })
      
    })

    // Group typing
    socket.on("Group-Typing", (data) => {
      if (
        activeChat &&
        data.group === activeChat._id &&
        data.sender !== CurrentUser.name &&
        activeChat.type === "group"
      ) {
        setIsTyping(true)
        setTypingUser(data.sender)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          setTypingUser("")
        }, 3000)
      }
    })

    // Direct typing
    socket.on("Direct-Typing", (data) => {
      if (
        activeChat &&
        data.chatId === activeChat._id &&
        data.sender !== CurrentUser.name &&
        activeChat.type === "direct"
      ) {
        setIsTyping(true)
        setTypingUser(data.sender)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          setTypingUser("")
        }, 3000)
      }
    })

socket.on("edited-group-message", async(data) => {
  console.log("Received edited message:", data);
  
  const msgid = data.messageId || data.id;
  const newMessageText = data.newMessage || data.message;
  const groupId = data.group;

  queryClient.setQueryData(["ChatEvents"], (oldData) => {
    if (!oldData) return oldData;

    return oldData.map(async (group) => {
      if (group._id === groupId) {
        return {
          ...group,
          Messages: group.Messages.map((msg) =>
            msg.id === msgid ? { ...msg, message: newMessageText,isEdited:true } : msg
          ),
        };
      }
      try {
        const userId = CurrentUser?.id;
        console.log("userId",userId)
        if (!userId) return [];
        // Fetch all chats for user
        const res = await axios.get(`http://localhost:8000/api/chats/current/${userId}`, {
          withCredentials: true,
       headers: { Authorization: `Bearer ${userId}` },
        });
        const chats = res.data?.data || [];
        console.log("All chats:", chats);
        const directChats = chats.map((chat) => {
          let chatter = chat.chatters && chat.chatters.length > 0 ? chat.chatters[0] : null;
          return {
            _id: chatter?._id || chat._id,
            title: chatter?.name || "Unknown",
            Messages: chat.messages || [],
            type: "direct",
            isOnline: true,
            publicKey: chatter?.publicKey || ""
          }
        });
        return directChats;
      } catch (error) {
        console.error("Error fetching direct chats:", error);
        return [];
      }
    }
        );
      });

        setActiveChat((prevActiveChat) => ({
          ...prevActiveChat,
          Messages: prevActiveChat.Messages.filter((msg) => msg.id !== data.messageId),
        }))
      }
    )


    socket.on("deleted-message",(data)=>{
      console.log("mesage about to be delted",data)
      const messageId=data.messageId
      if (socket) {
        console.log(activeChat.title,"active chat",messageId)
        queryClient.setQueryData(["DirectChats"], (oldData) => {
          if (!oldData) return oldData
          const newData = oldData.map((chat) => {
              return {
                ...chat,
                Messages: (chat.Messages || []).filter((msg) => msg.id !== messageId),
              }
          })
          return newData
        })

        setActiveChat((prevActiveChat) => ({
          ...prevActiveChat,
          Messages: (prevActiveChat.Messages || []).filter((msg) => msg.id !== messageId),
        }))
        
      }
    })

socket.on("edited-message", (data) => {
  console.log("message edit from peer to peer", data);
  const messageId = data.messageId;
  const newMessageText = data.encrynewMessage;
  const sender = data.sender;
  const isEdited = true;

  console.log(data)

  if (socket) {
    // Update DirectChats cache
    queryClient.setQueryData(["DirectChats"], (oldData) => {
      if (!oldData) return oldData;

      return oldData.map((chat) => ({
        ...chat,
        Messages: (chat.Messages || []).map((msg) =>
          msg.id === messageId
            ? { ...msg, message: newMessageText, isEdited, sender }
            : msg
        ),
      }));
    });

    // Update activeChat state
    setActiveChat((prevActiveChat) => ({
      ...prevActiveChat,
      Messages: (prevActiveChat.Messages || []).map((msg) =>
        msg.id === messageId
          ? { ...msg, message: newMessageText, isEdited, sender }
          : msg
      ),
    }));
  }
});


    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("Group-Typing")
      socket.off("Direct-Typing")
      socket.off("Group-Message")
      socket.off("Recieve-peer2peer")
      socket.off("edited-group-message")
      socket.off("deleted-message")
      socket.off("deleted-group-message")
      socket.off("edited-message")
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [socket, activeChat, CurrentUser])

   

  useEffect(() => {
    setIsTyping(false)
    setTypingUser("")

    // Mark messages as read when opening a chat
    if (activeChat) {
      setUnreadCounts((prev) => ({
        ...prev,
        [activeChat._id]: 0,
      }))
    }
  }, [activeChat])

  // Send message logic: API for persistence, socket for real-time
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!socket || !activeChat || !message.trim()) return;

    const MessageId = Date.now();
    const newMessage = {
      id: MessageId,
      senderId: CurrentUser._id,
      senderName: CurrentUser.name,
      message: message.trim(),
      timestamp: Date.now(),
    };

    if (activeChat.type === "group") {
      // 1. Send to backend API
      try {
        await axios.post("http://localhost:8000/group/send", {
          groupId: activeChat._id,
          message: newMessage.message,
          messageId: MessageId,
        }, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${userId}` },
        });
      } catch (err) {
        console.error("API group message error", err);
      }
      // 2. Emit socket event for real-time
      socket.emit("send-group-message", {
        groupId: activeChat._id,
        messageId: MessageId,
        timestamps: newMessage.timestamp,
        sender: newMessage.senderName,
        encrynewMessage: await encryptMessage(newMessage.message, activeChat.publicKey, privateKey),
      });
      // 3. Update UI
      queryClient.setQueryData(["ChatEvents"], (oldData) => {
        if (!oldData) return oldData;
        let updated = false;
        const newData = oldData.map((group) => {
          if (group._id === activeChat._id) {
            const exists = group.Messages.some((msg) => msg.id === newMessage.id);
            if (!exists) {
              updated = true;
              return {
                ...group,
                Messages: [...group.Messages, { ...newMessage, group: activeChat._id }],
              };
            }
          }
          return group;
        });
        return updated ? newData : oldData;
      });
      setActiveChat((prevActiveChat) => ({
        ...prevActiveChat,
        Messages: [...(prevActiveChat.Messages || []), { ...newMessage, group: activeChat._id }],
      }));
    } else {
      // 1. Send to backend API
      try {
        await axios.post("http://localhost:8000/chat/send", {
          receiverId: activeChat._id,
          message: await encryptMessage(newMessage.message, activeChat.publicKey, privateKey),
          chat_id: activeChat._id,
          messageId: MessageId,
        }, {
          withCredentials: true,
         headers: { Authorization: `Bearer ${userId}` },
        });
      } catch (err) {
        console.error("API direct message error", err);
      }
      // 2. Emit socket event for real-time
      socket.emit("Send-peer2peer", {
        messageId: MessageId,
        sender: newMessage.senderName,
        reciever: activeChat._id,
        timestamps: newMessage.timestamp,
        encrypted: await encryptMessage(newMessage.message, activeChat.publicKey, privateKey),
      });
      // 3. Update UI
      queryClient.setQueryData(["DirectChats"], (oldData) => {
        if (!oldData) return oldData;
        let updated = false;
        const newData = oldData.map((chat) => {
          if (chat._id === activeChat._id) {
            const exists = chat.Messages?.some((msg) => msg.id === newMessage.id);
            if (!exists) {
              updated = true;
              return {
                ...chat,
                Messages: [...(chat.Messages || []), newMessage],
              };
            }
          }
          return chat;
        });
        return updated ? newData : oldData;
      });
      setActiveChat((prevActiveChat) => ({
        ...prevActiveChat,
        Messages: [...(prevActiveChat.Messages || []), newMessage],
      }));
    }
    Scroll2Button();
    setMessage("");
  };

  const handleTyping = (e) => {
    setMessage(e.target.value)
    if (activeChat && CurrentUser) {
      debouncedTyping(activeChat._id, CurrentUser.name, activeChat.type === "group")
    }
  }

  const handleUnsendMessage = (messageId) => {
    if (activeChat.type === "group") {
      if (socket) {
        console.log("active chat",activeChat)
        socket.emit("delete-group-message",{
          messageId,
          "groupId":activeChat._id
        })
        queryClient.setQueryData(["ChatEvents"], (oldData) => {
          if (!oldData) return oldData
          const newData = oldData.map((group) => {
            if (group._id === activeChat._id) {
              return {
                ...group,
                Messages: group.Messages.filter((msg) => msg.id !== messageId),
              }
            }
            return group
          })
          return newData
        })

        setActiveChat((prevActiveChat) => ({
          ...prevActiveChat,
          Messages: prevActiveChat.Messages.filter((msg) => msg.id !== messageId),
        }))
      }
    } else {
      if (socket) {
        socket.emit("delete-message",{
          messageId,"receiver":activeChat._id
        })
        console.log(activeChat.title,"active chat",messageId)
        queryClient.setQueryData(["DirectChats"], (oldData) => {
          if (!oldData) return oldData
          const newData = oldData.map((chat) => {
            if (chat._id === activeChat._id) {
              return {
                ...chat,
                Messages: (chat.Messages || []).filter((msg) => msg.id !== messageId),
              }
            }
            return chat
          })
          return newData
        })

        setActiveChat((prevActiveChat) => ({
          ...prevActiveChat,
          Messages: (prevActiveChat.Messages || []).filter((msg) => msg.id !== messageId),
        }))
        
      }
    }
  }


  const getCurrentChats = () => {
    if (activeTab === "groups") {
      return (groupData || [])
        .filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((event) => ({ ...event, type: "group" }))
    } else {
      // Filter out current user from direct chats
      return (directData || [])
        .filter((chat) => chat.title !== CurrentUser?.name) // Don't show yourself in direct chats
        .filter((chat) => chat.title?.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((chat) => ({ ...chat, type: "direct" }))
    }
  }

  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
  }

  const getTabUnreadCount = (tab) => {
    const chats = tab === "groups" ? groupData || [] : directData || []
    return chats.reduce((sum, chat) => sum + (unreadCounts[chat._id] || 0), 0)
  }

  const currentChats = getCurrentChats()
  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gray-50 md:ml-14">
        {/* Sidebar - Desktop & Mobile */}
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
                  {getTotalUnreadCount() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                      {getTotalUnreadCount()}
                    </Badge>
                  )}
                </div>
                <h1 className="text-lg font-semibold">Messages</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => refetchDirectChats()}>
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
                <TabsTrigger value="groups" className="relative">
                  <Users className="w-4 h-4 mr-2" />
                  Groups ({(groupData || []).length})
                  {getTabUnreadCount("groups") > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                      {getTabUnreadCount("groups")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="direct" className="relative">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Direct ({(directData || []).filter((chat) => chat.title !== CurrentUser?.name).length})
                  {getTabUnreadCount("direct") > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                      {getTabUnreadCount("direct")}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Conversations List */}
         <ScrollArea className="flex-1">
  {currentChats.length === 0 ? (
    <div className="p-4 text-center text-gray-500">
      {activeTab === "groups" ? "No groups available" : "No users online"}
    </div>
  ) : (
    currentChats.map((chat) => (
      <ChatListItem
        key={chat._id}
        chat={chat}
        unreadCount={unreadCounts[chat._id] || 0}
        setActiveChat={setActiveChat}
        activeChat={activeChat}
        CurrentUser={CurrentUser}
        privateKey={privateKey}
      />
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
            <div className="flex items-center space-x-2">
              {activeChat?.type === "direct" && (
                <>
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e)=>handleVideoCalling(activeChat._id,activeChat.title)}  style={{ pointerEvents: "auto" }} >
                    <Video className="w-5 h-5"  />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
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
                        {activeChat.type === "group" ? (
                          <span>{activeChat.participantCount || 0} members</span>
                        ) : (
                          <span className={activeChat.isOnline ? "text-green-500" : "text-gray-500"}>
                            {activeChat.isOnline ? "Online" : "Offline"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="text-gray-500">
                      <Search className="w-5 h-5" />
                    </Button>
                    {activeChat.type === "direct" && (
                      <>
                        <Button variant="ghost" size="icon" className="text-gray-500">
                          <Phone className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500"
                         onClick={() => handleVideoCalling(activeChat._id,activeChat.title)}
                        >
                          <Video className="w-5 h-5" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="text-gray-500">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-white">
                <div className="space-y-4 pb-4">
                  {activeChat.Messages?.map((msg) => {
                    const isUser = msg.senderId === CurrentUser?._id
              
                    return (
                      <React.Fragment key={msg.id}>
                                <ChatBubble
                                isGroupMessage={activeChat.type=="group"?true:false}
                                msg={msg}
                                publicKey={activeChat.publicKey}
                                isUser={isUser}
                                activeChat={activeChat}
                                handleUnsendMessage={handleUnsendMessage}
                                handleEditMessage={handeleditMessage}
                                myPrivateKey={privateKey}
                              />
                     
                      </React.Fragment>
                    )
                  })}
                            {editingMessage ? (
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingMessage.text}
                      onChange={(e) =>
                        seteditingMessage({ ...editingMessage, text: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          submitEdit(editingMessage,editingMessage.id);
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex justify-end mt-1 space-x-2">
                      <button
                        className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => submitEdit(editingMessage,editingMessage.id)}
                      >
                        Save
                      </button>
                      <button
                        className="px-3 py-1 text-sm rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
                        onClick={() => seteditingMessage(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}


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
  )
}

export default ChatMain
