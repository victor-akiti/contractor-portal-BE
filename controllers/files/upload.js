const { cloudinary } = require("../../helpers/cloudinary");
const { sendBasicResponse } = require("../../helpers/response");
const { FileModel } = require("../../models/file");


exports.uploadFiles = async (req, res, next) => {
    try {
        console.log("Uploading files");
        console.log(req.files);
        const user = req.user
        console.log({user});
        let fileUrls = []

        console.log({body: req.body});

        if (req.files.length > 0) {
            for (let index = 0; index < req.files.length; index++) {
                const element = req.files[index];
                
                const uploadFile = await cloudinary.uploader.upload(req.files[0].path, {resource_type: "auto"})

                console.log({uploadFile});
                const newFile = new FileModel({
                    userID: user.uid,
                    downloadURL: uploadFile.url,
                    secureDownloadURL: uploadFile.secure_url,
                    timestamp: Date.now(),
                    name: element.originalname,
                    type: element.mimetype,
                    label: req.body.label,
                    updateCode: req.body.updateCode
                })

                const savedFile = await newFile.save()

                console.log({savedFile});

                if (savedFile) {
                    fileUrls.push({
                        url: uploadFile.url,
                        name: element.originalname,
                        label: req.body.label,
                        _id: savedFile._id,
                        updateCode: req.body.updateCode
                    })
                }
                
            }

            console.log({fileUrls});

            sendBasicResponse(res, fileUrls)
        } else {
            return
        }
        

        
    } catch (error) {
        next(error)
    }
}