import { Router } from "express";
import verifyJWT from "../Middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getMyTweets, getMyTweetsWithDetails, updateTweet } from "../Controllers/tweet.controller.js";

const router = Router();

router.route("/createTweet").post(verifyJWT,createTweet)

router.route("/getMytweets").get(verifyJWT,getMyTweets)

router.route("/getMyTweetsWithDetails").get(verifyJWT,getMyTweetsWithDetails)

router.route("/updateTweet/:tweetId").patch(verifyJWT,updateTweet)

router.route("/deleteTweet/:tweetId").delete(verifyJWT, deleteTweet)

export default router