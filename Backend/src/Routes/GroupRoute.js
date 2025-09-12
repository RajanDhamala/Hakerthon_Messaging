import { Router } from "express";
import mvpAuth from "../Middlewares/ClerkMiddle.js";
import {
    CreateGroup,
    fetchGroupMembers,
    fetchGroupMessages,
    SendgroupMessage,
    DeleteGroupMessage,
    EditGroupMessage,
    fetchCurrentChats,
    getJoinedGroups
} from "../Controller/GroupController.js";
import { get } from "mongoose";

const GroupRoute = Router();

GroupRoute.post('/create', mvpAuth, CreateGroup);
GroupRoute.get('/members/:groupId', mvpAuth, fetchGroupMembers);
GroupRoute.get('/messages/:groupId', mvpAuth, fetchGroupMessages);
GroupRoute.post('/send', mvpAuth, SendgroupMessage);
GroupRoute.delete('/delete/:groupId/:msgId', mvpAuth, DeleteGroupMessage);
GroupRoute.put('/edit', mvpAuth, EditGroupMessage);
GroupRoute.get('/current/:userId', mvpAuth, fetchCurrentChats);
GroupRoute.get('/joined', mvpAuth, getJoinedGroups);

GroupRoute.get('/', (req, res) => {
    console.log("Hello res form group route");
    res.send("Hello res form group route");
})

export default GroupRoute;
