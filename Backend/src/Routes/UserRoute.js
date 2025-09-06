import { Router } from "express";

const UserRoute =  Router();
UserRoute.get('/',(req,res)=>{
    console.log("Hello res form user route");
    res.send("Hello res form user route");
})


export default UserRoute;