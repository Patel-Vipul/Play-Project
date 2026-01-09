import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
    api_key: `${process.env.CLOUDINARY_API_KEY}`,
    api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});

//to upload files on cloudinary
const uploadFilesOnCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;

        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        });
        // console.log(response.url);
        fs.unlinkSync(filePath);
        return response;
    } catch (error) {
        if(fs.existsSync) fs.unlinkSync(filePath);
        
        console.log("Failed to Upload file on Cloudinary :: ", error);
        return null
    }
};

//to delete/destroy file on cloudinary(we have to use public id of that file)
const extractPublicId = (cloudinaryURL) => {
    const parts = cloudinaryURL.split("/")
    const fileWithExtension = parts[parts.length-1]
    const publicId = fileWithExtension.split(".")[0]
    return publicId
}

const deleteFromCloudinary = async (cloudinaryURL) => {
    try {
        const publicId = extractPublicId(cloudinaryURL)
        const response = await cloudinary.uploader.destroy(publicId);

        if(response){
            console.log("File deleted from cloudinary")
            return response
        }
    } catch (error) {
        console.log("Error deleting from cloudinary ",error?.messgae)
    }
}


export { uploadFilesOnCloudinary,deleteFromCloudinary };
