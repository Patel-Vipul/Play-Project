import { Router } from "express"
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updatAccountDetails, updateUserAvatar, deleteUserAccount, updateUserCoverImage }  from "../Controllers/user.controller.js";
import upload from "../Middlewares/multer.middleware.js";
import verifyJWT from "../Middlewares/auth.middleware.js";

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

router.route("/updateAccountDetails").post(
    verifyJWT,
    updatAccountDetails
)

router.route("/updateUserAvatar").post(
    upload.fields([
        {
            name : "updatedAvatar",
            maxCount : 1
        }
    ]),
    verifyJWT,
    updateUserAvatar
)

router.route("/updateUserCoverImage").post(
    upload.fields([
        {
            name : "updatedCoverImage",
            maxCount : 1
        }
    ]),
    verifyJWT,
    updateUserCoverImage
)

router.route("/deleteUserAccount").delete(
    verifyJWT,
    deleteUserAccount
)

export default router;