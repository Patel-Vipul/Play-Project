import dotenv from "dotenv"
import connectDB from "./DB/databaseConnection.js"
import express from "express"

const app = express();

app.get("/", (req,res) => {
    res.send("Hello Welcome to my Server")
})
app.get("/about", (req,res) => {
    res.send("Hello Welcome to About")
})

app.listen(process.env.PORT, () => {
    console.log("App is listening on port ", process.env.PORT)
})

dotenv.config({
    path: "./env"
})

connectDB()
console.log("Databse Connected")

//an appraoch to connet db
/**
;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${dbName}`)

        app.on("error", (error) => {
            console.log("Error ",error)
        })

        const port = process.env.PORT

        app.listen(port, () => {
            console.log("App is listening on port ",port)
        })
    } catch (error) {
        console.log("Mongoose Error !!!" , error)
    } 
})()
*/