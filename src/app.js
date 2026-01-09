import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

//"use" object is used to configure middleware
//it will configure whether the request on backend is valid or not
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//configure all the json request
app.use(express.json({limit: process.env.REQUEST_LIMIT}))

//configure the url dashes and other character(like %)
app.use(express.urlencoded({extended: true, limit: process.env.REQUEST_LIMIT}))

//configure the request of body (like form)
app.use(cookieParser());


//importing all the routes
import userRouter from "./Routes/user.routes.js"

app.use("/api/v1/users",userRouter)  //route is seperated, so it has to be used as middleware

export default app;