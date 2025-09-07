import User from "../Schemas/UserSchema.js";
import asyncHandler from "../Utils/AsyncHandler.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import Groupchat from "../Schemas/GroupchatSchema.js";

// ===== Create Group =====
const CreateGroup = asyncHandler(async (req, res) => {
    const { name } = req.body;

    const groupChat = await Groupchat.create({ 
        name,
        members: [req.user.user_id],
        messages: [{
            sender: req.user.user_id,
            message: "Group created",
            messageId: new Date().getTime().toString()
        }]
    });

    return res.status(201).json(new ApiResponse(true, "Group created successfully", groupChat));
});

// ===== Fetch Group Members =====
const fetchGroupMembers = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user.user_id;

    if (!groupId) throw new ApiError(400, "groupId is required");

    const group = await Groupchat.findById(groupId).populate("members", "name profilePic");
    if (!group) throw new ApiError(404, "Group not found");

    if (!group.members.some(m => m._id.toString() === userId)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    return res.status(200).json(new ApiResponse(true, "Group fetched successfully", group));
});

// ===== Fetch Last 10 Group Messages =====
const fetchGroupMessages = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const userId = req.user.user_id;

    const group = await Groupchat.findById(groupId).populate("members", "name profilePic");
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

    const group = await Groupchat.findById(groupId);
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

    const group = await Groupchat.findById(groupId);
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

    const group = await Groupchat.findById(groupId);
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

    const groups = await Groupchat.find({ members: userId })
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
            lastMessage
        });
    }

    return res.status(200).json(new ApiResponse(true, "Current group chats fetched successfully", chats));
});

export {
    CreateGroup,
    fetchGroupMembers,
    fetchGroupMessages,
    SendgroupMessage,
    DeleteGroupMessage,
    EditGroupMessage,
    fetchCurrentChats
};
