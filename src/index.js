// require("dotenv").config({path:"/.env"})
import dotenv from "dotenv"
import connectDB from "./DB/databaseConnection.js"
import app from "./app.js"

dotenv.config({
    path: "./env"
})

connectDB()
.then(()=> {
    const port = process.env.PORT;
    app.listen(port || 8000,()=>{
        console.log("App is listening on port ",port)
    })
})
.catch((error) => {
    console.log("MONGOOSE connection failed ",error)
})



















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