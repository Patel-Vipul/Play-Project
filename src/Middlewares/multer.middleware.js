import multer from "multer"

const storage = multer.diskStorage({
    destination : function (req,file,cb){
        cb(null,"../../public/temp")
    },
    filename : function(req, file, cb) {
        //add suffix to make url/filename complex
        // cb(null,file.filename+ "")

        cb(null, file.originalname)
    }
})

export const upload = multer({storage :  storage});
