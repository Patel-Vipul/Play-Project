import { Router } from "express"
import upload from "../Middlewares/multer.middleware.js";
import verifyJWT from "../Middlewares/auth.middleware.js";
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updatAccountDetails, updateUserAvatar, deleteUserAccount, updateUserCoverImage, getCurrentUserChannel, getWatchHistory }  from "../Controllers/user.controller.js";

const router = Router();

router.route("/register").post(
    upload.fields([ 
        {
            name : "avatar",
            maxCount : 1
        },{
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)

router.route("/login").post(
    loginUser
)

//secured routes(only authorised user can visit)
router.route("/logout").post(
    verifyJWT,
    logoutUser
)

router.route("/refreshToken").post(
    refreshAccessToken
)

router.route("/changePassword").post(
    verifyJWT,
    changeCurrentPassword
)

router.route("/getCurrentUser").get(
    verifyJWT,
    getCurrentUser
)

router.route("/updateAccountDetails").patch(
    verifyJWT,
    updatAccountDetails
)

router.route("/updateUserAvatar").patch(
    verifyJWT,
    upload.fields([
        {
            name : "updatedAvatar",
            maxCount : 1
        }
    ]),
    updateUserAvatar
)

router.route("/updateUserCoverImage").patch(
    verifyJWT,
    upload.fields([
        {
            name : "updatedCoverImage",
            maxCount : 1
        }
    ]),
    updateUserCoverImage
)

router.route("/deleteUserAccount").delete(
    verifyJWT,
    deleteUserAccount
)

router.route("/channel/:userName").get(verifyJWT, getCurrentUserChannel)

router.route("/watchHistory").get(verifyJWT,getWatchHistory)

export default router;