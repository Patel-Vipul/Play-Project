import asyncHandler from "../Utils/asyncHandler.js";
import { User } from "./../Models/User.model.js"
import apiError from "../Utils/apiError.js";
import { deleteFromCloudinary, uploadFilesOnCloudinary } from "../Utils/cloudinary.js";
import apiResponce from "../Utils/apiResponse.js";
import jwt from "jsonwebtoken"

const options = {    //to disable the editing of cookies from else-where
    httpOnly : true,
    secure : true
}

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new apiError(500, "Something went wrong while generating refresh token and access token")
    }
}

const registerUser = asyncHandler( async(req, res) => {

    // get user detail from frontend/postman
    const {userName, email, fullName, password} = req.body

    // validation (whether the required field is empty or not)
    if(
        [userName, email, fullName, password].some((field) => field?.trim() === "")
    ){
        throw new apiError(400, "All fields are required!")
    }

    if(!email.includes("@gmail.com" || "@mail.com")){
        throw new apiError(422, "email is invalid")
    }

    // check whether the user is already exists
    const existedUserName = await User.findOne({userName})

    if(existedUserName) {
        throw new apiError(409, "User with this UserName already exists")
    }

    const existedEmail = await User.findOne({email});
    if(existedEmail) {
        throw new apiError(409, "User with this email already exists!")
    }

    // check for images[avatar]
    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if(req.files && req.files.coverImage && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) {
        throw new apiError(409, "Avatar is Required")
    }

    // upload them to cloudinary [avatar and coverimage]
    const avatarResponse = await uploadFilesOnCloudinary(avatarLocalPath)
    const coverImageResponse = coverImageLocalPath ? await uploadFilesOnCloudinary(coverImageLocalPath) : null;

    if(!avatarResponse){
        throw new apiError(500,"Error on File Upload")
    }

    // create user object to db
    const user = await User.create({
        userName : userName.toLowerCase(),
        email,
        fullName,
        avatar : avatarResponse.url,
        coverImage : coverImageResponse?.url || "",
        password
    })

    // check for user creation
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) {
        throw new apiError(500, "Something went wrong while creating user")
    }

    console.log("User is Created ",createdUser)
    //return response to frontend
    return res.status(201).json(
        new apiResponce(200, createdUser, "User Created Successfully")
    )
})

const loginUser = asyncHandler( async (req,res) => {
    //req.body => data
    const {userName, email, password} = req.body;
    
    //check if username or email is sent or not
    if(!userName && !email){
        throw new apiError(401, "login credentials are required")
    }

    //find the user
    const user = await User.findOne({
        $or : [{email}, {userName}]
    }
    )

    // console.log(user);

    if(!user){
        throw new apiError(404,"User doesnot exists")
    }

    //check the password
    const isValidPassword = await user.isPasswordCorrect(password);
    if(!isValidPassword) {
        throw new apiError(401,"Invalid user Credentials")
    }

    //generate access token and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    //send access token through cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res.
    status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponce(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User Logged in Successfully!"
        )
    )

})

const logoutUser = asyncHandler(async(req,res) => {
    //update/remove refresh token
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    // console.log(user)
    //clear cookies

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new apiResponce(200,{}, "User LoggedOut Successfully!"))
    
})

const refreshAccessToken = asyncHandler( async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new apiError(401,"Unauthorised Request")
    }

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new apiError(401,"Invalid Refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new apiError(401,"Refresh Token is Expired or used")
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user?._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new apiResponce(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token is Refreshed"
        )
    )
})

const changeCurrentPassword = asyncHandler( async (req,res) => {
    //get required field to change password
    const {oldPassword, newPassword, confirmPassword} = req.body;

    if(newPassword !== confirmPassword){
        throw new apiError(401,"confirm password should be same as new password")
    }

    if(!(oldPassword && newPassword && confirmPassword)){
        throw new apiError("invalid credientials")
    }

    //find user with that password in db
    const user = await User.findById(req.user?._id);

    console.log(user)

    //match the password
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordValid){
        throw new apiError(401,"invalid password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(201)
    .json(
        new apiResponce(201,{oldPassword, newPassword}, "Password is Changed Successfully!")
    )

})

const getCurrentUser = asyncHandler( async (req,res) => {
    const user = await User.findById(req.user?._id).select("-password");

    return res
    .status(200)
    .json(
        new apiResponce(200,{
                user
            },
        "Current user fetched Successfully!")
    )
})

const updatAccountDetails = asyncHandler( async(req,res) => {
    //get user details(only authentic user can update their details)
    const {fullName, email} = req.body;

    if(!(fullName || email)){
        throw new apiError(401, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new apiResponce(
            200,
            user,
            "All fields are Updated!"
        )
    )
})

const updateUserAvatar = asyncHandler( async(req, res) => {
    //take localfile path
    const newAvatarLocalPath = req.files?.updatedAvatar[0]?.path

    if(!newAvatarLocalPath){
        throw new apiError(401,"Avatar file is Missing")
    }

    //upload on cloudinary
    const newAvatar = await uploadFilesOnCloudinary(newAvatarLocalPath);

    if(!newAvatar.url){
        throw new apiError(500,"Error while uploading file on cloudinary")
    }

    //update url in db
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar : newAvatar?.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    //delete old file/avatar from cloudinary
    const oldAvatarUrl = req.user?.avatar
    await deleteFromCloudinary(oldAvatarUrl);

    return res
    .status(200)
    .json(
        new apiResponce(
            200,
            user,
            "Avatar is Updated successfully"
        )
    )
})

const updateUserCoverImage = asyncHandler( async(req, res) => {

    const newCoverImageLocalPath = req.files?.updatedCoverImage[0]?.path

    if(!newCoverImageLocalPath){
        throw new apiError(401,"Cover-image is required")
    }
    
    const oldCoverImageUrl = req.user?.coverImage;
    await deleteFromCloudinary(oldCoverImageUrl)

    const newCoverImage = await uploadFilesOnCloudinary(newCoverImageLocalPath)

    if(!newCoverImage.url){
        throw new apiError(500, "Error while uploading files on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage : newCoverImage.url
            }
        },
        { new : true}
    ).select("-password -refreshToken")



    return res
    .status(200)
    .json(
        new apiResponce(
            200,
            user,
            "Cover Image Updated successfully!"
        )
    )
})

const deleteUserAccount = asyncHandler( async(req, res) => {

    //delete all the files from cloudinary
    const avatar = req.user?.avatar
    const coverImage = req.user?.coverImage

    await deleteFromCloudinary(avatar)
    if(coverImage) await deleteFromCloudinary(coverImage);

    //delete their record from db
    const user = await User.findByIdAndDelete(
        req.user?._id
    ).select("-password")

    if(!user){
        throw new apiError(401, "Invalid User id")
    }

    //clear their cookies
    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")

    return res
    .status(200)
    .json(
        new apiResponce(200,
            user,
            "User is Successfully Deleted"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updatAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    deleteUserAccount
};