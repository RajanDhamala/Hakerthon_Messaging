import { Router } from "express";
import { RegisterUser } from "../Controller/UserController.js";
const UserRoute =  Router();


UserRoute.get('/',(req,res)=>{
    console.log("Hello res form user route");
    res.send("Hello res form user route");
})

UserRoute.post('/register',RegisterUser);



export default UserRoute;