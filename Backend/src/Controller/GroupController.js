import User from "../Schemas/UserSchema.js";
import asyncHandler from "../Utils/AsyncHandler.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import GroupChat from "../Schemas/GroupchatSchema.js"

// ===== Create Group =====
const CreateGroup = asyncHandler(async (req, res) => {
  const { members, name } = req.body;
  const sender = req.user;

  if (!name || !members?.length) {
    throw new Error("Group name and members are required");
  }
  const newGroup = await GroupChat.create({
    name,
    members: [...members],
    messages: [
      {
        sender,
        message: "Group created successfully!",
        messageId: new Date().getTime().toString(),
        timestamps: new Date(),
      },
    ],
  });

  return res
    .status(201)
    .json(new ApiResponse(true, "Group created successfully", newGroup));
});

// ===== Fetch Group Members =====
const fetchGroupMembers = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.user;

    if (!groupId) throw new ApiError(400, "groupId is required");

    const group = await GroupChat.findById(groupId).populate("members", "name profilePic");
    if (!group) throw new ApiError(404, "Group not found");

    if (!group.members.some(m => m._id.toString() === userId)) {
        throw new ApiError(403, "You are not a member of this group");
    }
    return res.status(200).json(new ApiResponse(true, "Group fetched successfully", group));
});

// ===== Fetch Last 10 Group Messages =====
const fetchGroupMessages = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.user;

    const group = await GroupChat.findById(groupId).populate("members", "name profilePic");
    if (!group) throw new ApiError(404, "Group not found");
    if (!group.members.some(m => m._id.toString() === userId)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    const messages = group.messages
        .sort((a, b) => new Date(b.timestamps) - new Date(a.timestamps))
        .slice(0, 10)
        .reverse(); 

    await User.populate(messages, { path: "sender", select: "name profilePic" });

    return res.status(200).json(new ApiResponse(true, "Group messages fetched successfully", {
        groupId: group._id,
        name: group.name,
        members: group.members,
        messages
    }));
});

// ===== Send Message in Group =====
const SendgroupMessage = asyncHandler(async (req, res) => {
    const { groupId, message, messageId } = req.body;
    const userId = req.user.user_id;

    if (!groupId || !message) throw new ApiError(400, "groupId and message are required");

    const group = await GroupChat.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");
    if (!group.members.map(m => m._id.toString()).includes(userId)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    group.messages.push({ sender: userId, message, messageId });
    await group.save();

    return res.status(200).json(new ApiResponse(true, "Message sent successfully", group));
});

// ===== Delete Message in Group =====
const DeleteGroupMessage = asyncHandler(async (req, res) => {
    const { groupId, msgId } = req.params;
    const userId = req.user.user_id;

    if (!groupId || !msgId) throw new ApiError(400, "groupId and msgId are required");

    const group = await GroupChat.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    group.messages.forEach(m => {
        if (m.messageId.toString() === msgId && m.sender.toString() === userId) m.remove();
    });

    await group.save();
    return res.status(200).json(new ApiResponse(true, "Message deleted successfully", group));
});

// ===== Edit Message in Group =====
const EditGroupMessage = asyncHandler(async (req, res) => {
    const { groupId, msgId, newMsg } = req.body;
    const userId = req.user.user_id;

    if (!groupId || !msgId || !newMsg) throw new ApiError(400, "groupId, msgId and newMsg are required");

    const group = await GroupChat.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    const message = group.messages.find(m => m.messageId.toString() === msgId);
    if (!message) throw new ApiError(404, "Message not found");
    if (message.sender.toString() !== userId) throw new ApiError(403, "You are not authorized to edit this message");

    message.message = newMsg;
    await group.save();

    return res.status(200).json(new ApiResponse(true, "Message edited successfully", group));
});

// ===== Fetch Current User's Group Chats =====
const fetchCurrentChats = asyncHandler(async (req, res) => {
    const userId = req.user.user_id;

    const groups = await GroupChat.find({ members: userId })
        .select("name members messages")
        .populate("members", "name profilePic")
        .lean();

    const chats = [];

    for (const group of groups) {
        const lastMessage = group.messages
            .sort((a, b) => new Date(b.timestamps) - new Date(a.timestamps))[0];
        if (lastMessage) await User.populate(lastMessage, { path: "sender", select: "name profilePic" });

        chats.push({
            chatId: group._id,
            name: group.name,
            members: group.members,
            lastMessagez
        });
    }

    return res.status(200).json(new ApiResponse(true, "Current group chats fetched successfully", chats));
});


const getJoinedGroups = asyncHandler(async (req, res) => {
  const userId = req.user;
  if (!userId) {
    throw new Error("User ID missing");
  }

  // Fetch groups where the user is a member
  const groups = await GroupChat.find({ members: { $in: [userId] } })
    .select("name messages members")
    .populate("members", "_id name profilePic") // populate members
    .populate({
      path: "messages.sender",   // populate sender in messages
      select: "_id name",
    })
    .lean();

  // Map groups to include only last message with populated sender
  const formattedGroups = groups.map((group) => {
    const lastMessage = group.messages?.length
      ? group.messages[group.messages.length - 1]
      : null;

    return {
      _id: group._id,
      name: group.name,
      members: group.members, // optional, can remove if not needed
      messages: lastMessage
        ? {
            messageId: lastMessage.messageId,
            message: lastMessage.message,
            timestamps: lastMessage.timestamps,
            sender: lastMessage.sender
              ? {
                  _id: lastMessage.sender._id,
                  name: lastMessage.sender.name,
                }
              : null,
          }
        : null,
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(true, "Groups fetched successfully", formattedGroups));
});

export {
    CreateGroup,
    fetchGroupMembers,
    fetchGroupMessages,
    SendgroupMessage,
    DeleteGroupMessage,
    EditGroupMessage,
    fetchCurrentChats,
    getJoinedGroups
};
