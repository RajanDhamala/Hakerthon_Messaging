import { Router } from "express";

const ChatRoute = Router();

ChatRoute.get('/',(req,res)=>{
    console.log("Hello res form chat route");
    res.send("Hello res form chat route");
})

export default ChatRoute;
