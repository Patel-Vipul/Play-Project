import mongoose from "mongoose";
import { DB_NAME } from "./../constants.js" //full name required with extension

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        
        if(connectionInstance){
            console.log("\n MongoDb connected !! DB Host : ",connectionInstance.connection.host)
        }
    } catch (error) {
        console.log("MONGODB Connection Failed :: ",error);
        process.exit(1)
    }
}

export default connectDb