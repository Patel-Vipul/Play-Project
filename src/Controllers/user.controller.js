import asyncHandler from "../Utils/asyncHandler.js";
import { User } from "./../Models/User.model.js"
import apiError from "../Utils/apiError.js";
import { uploadFilesOnCloudinary } from "../Utils/cloudinary.js";
import apiResponce from "../Utils/apiResponse.js";

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

    console.log("USer is Created ",createdUser)
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

    console.log(user);

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

    const options = {    //to disable the editing of cookies from else-where
        httpOnly : true,
        secure : true
    }

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
    await User.findByIdAndUpdate(req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )
    //clear cookies

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new apiResponce(200,{}, "User LoggedOut Successfully!"))
    
})


export {
    registerUser,
    loginUser,
    logoutUser
};