import { Router } from "express";
import { fetchPeerMessages,sendMessage,DeleteMessage,EditMessage,fetchCurrentChats} from "../Controller/ChatController.js";

const ChatRoute = Router();

ChatRoute.get('/',(req,res)=>{
    console.log("Hello res form chat route");
    res.send("Hello res form chat route");
})

ChatRoute.get('/peer/:userId',fetchPeerMessages);
ChatRoute.get('/send/:senderId/:receiverId/:message',sendMessage);

ChatRoute.delete('/delete/:chatId/:msgId',DeleteMessage);
ChatRoute.put('/edit',EditMessage);

ChatRoute.get('/current/:userId',fetchCurrentChats);

export default ChatRoute;
