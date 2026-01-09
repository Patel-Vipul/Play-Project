import jwt from "jsonwebtoken"
import apiError from "../Utils/apiError.js";
import asyncHandler from "../Utils/asyncHandler.js";
import { User } from "../Models/User.model.js";


const verifyJWT = asyncHandler( async (req,_,next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ","");
    
        if(!accessToken){
            throw new apiError(401, "Unauthorised request!")
        }
    
        const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET,)
    
        const user = await User.findById(decodedAccessToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new apiError(401,"Unvalid Access Token!")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new apiError(401,"Access Denies, try again")
    }

})

export default verifyJWT