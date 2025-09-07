import { Router } from "express";
import { RegisterUser,CheckUserExists,searchUsers,sendMessageRequest,AcceptMessageRequest,seeMessageRequests } from "../Controller/UserController.js";
import { getAllConnectedUsers } from "../Controller/SocketController.js";
import mvpAuth from "../Middlewares/ClerkMiddle.js";

const UserRoute =  Router();


UserRoute.get('/',(req,res)=>{
    console.log("Hello res form user route");
    res.send("Hello res form user route");
})

UserRoute.post('/register',RegisterUser);

UserRoute.get('/exists/:clerkId',CheckUserExists);

UserRoute.get('/search',mvpAuth,searchUsers);

UserRoute.put('/msg-req/:receiverId',mvpAuth,sendMessageRequest);

UserRoute.put('/:type/:requestId',mvpAuth,AcceptMessageRequest);

UserRoute.get('/msg-reqs',mvpAuth,seeMessageRequests);

UserRoute.get('/all-sockets',async(req,res)=>{
    try{
        const users = await getAllConnectedUsers();
        res.status(200).json({users});
    }catch(err){
        console.error("Error fetching connected sockets:",err);
        res.status(500).json({message:"Internal server error"});
    }
})



export default UserRoute;