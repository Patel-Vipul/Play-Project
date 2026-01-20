import mongoose from "mongoose";
import { Tweet } from "../Models/tweet.model.js";
import apiError from "../Utils/apiError.js";
import asyncHandler from "../Utils/asyncHandler.js";
import apiResponce from "../Utils/apiResponse.js";



const createTweet = asyncHandler( async(req, res) => {
    //take tweet/content from postman/frontend
    const {content} = req.body;

    //validate whether the content is empty or not
    if(!content?.trim()){
        throw new apiError(401,"Content is required!")
    }

    //find owner of the tweet
    const user = req.user._id

    //create object/tweet in db
    const tweet = await Tweet.create({
        content,
        owner : user
    })

    //validate whether the tweet is created or not
    if(!tweet){
        throw new apiError(400,"Tweet doesnot created!")
    }

    return res
    .status(201)
    .json(
        new apiResponce(201,tweet,"Tweet has created Successfully!")
    )

})


const getMyTweets = asyncHandler(async(req, res) => {
    //find all the tweets created by the same user
    const tweet = await Tweet.find({        //find:- returns all the tweet
        owner : req.user?._id
    }).select("content -_id")

    //check whether tweet exists or not
    if(!tweet.length){
        throw new apiError(401,"Tweets not found")
    }

    console.log(tweet)

    return res
    .status(201)
    .json(
        new apiResponce(201,tweet,"Tweets fetched Successfully!")
    )
})


const getMyTweetsWithDetails = asyncHandler( async(req,res) => {
    //aggregate user model with tweet model
    const tweetWithUserDetail = await Tweet.aggregate([
        {
            //collect all the tweets with same userid
            $match : {
                owner : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerDetails"
            }
        },
        {
            //to convert array into object
            $addFields : {
                ownerDetails : {
                    $first : "$ownerDetails"
                }
            }
        },
        {
            $project : {
                content : 1,
                "ownerDetails.userName" : 1,
                "ownerDetails.email" : 1,
                "ownerDetails.fullName" : 1
            }
        }
    ])

    if(!tweetWithUserDetail){
        throw new apiError(401, "no user/tweet found")
    }

    console.log(tweetWithUserDetail)

    //to count the number of tweets
    const tweetCount = tweetWithUserDetail.length

    return res
    .status(201)
    .json(
        new apiResponce(201, {
            tweets : tweetWithUserDetail,
            totalTweet : tweetCount
        },
            "Tweet with user detail fetched Successfully!") 
    )
})

const updateTweet = asyncHandler( async(req, res) => {

    //take tweetId from url
    const {tweetId} = req.params;

    //take new tweet to update
    const {content} = req.body

    //check whether the content is given or not
    if(!content){
        throw new apiError(401, "Content is Required!")
    }

    //find and update only the tweet
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set : {
                content
            }
        },
        {
            new: true
        }
    )

    if(!updatedTweet){
        throw new apiError(401,"invalid tweet id")
    }

    console.log(updatedTweet)

    return res
    .status(201)
    .json( new apiResponce(201, {updatedTweet}, "Tweet Updated Successfully!"))
})

const deleteTweet = asyncHandler(async(req,res) => {
    //get tweet id from url
        const {tweetId} = req.params

        //get the userid who tries to delete the tweet
        const loggedInUserId = req.user._id
    
        if(!tweetId){
            throw new apiError(401, "Id is required")
        }
    
        //get the owner of the tweet
        const owner = await Tweet.findById(tweetId).select("owner -_id")


        if(!owner){
            throw new apiError(401,"Tweet not found!")
        }

        //check whether the owner of the tweet matches the deleter of the tweet(allow only owner to delete the twee)
        if(loggedInUserId.toString() !== owner.owner.toString()){
            throw new apiError(401,"Only owner can delete the tweet!")
        }

        //delete the tweet
        const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    
        return res
        .status(201)
        .json(
            new apiResponce(201, deletedTweet, "Tweet deleted Successfully!")
        )
})

export {
    createTweet,
    getMyTweets,
    getMyTweetsWithDetails,
    updateTweet,
    deleteTweet
}