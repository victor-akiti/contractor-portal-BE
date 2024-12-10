const { Error400Handler } = require("../../errorHandling/errorHandlers")
const { setAsSubstituteTemplate } = require("../../helpers/emailTemplates")
const { sendMail } = require("../../helpers/mailer")
const { sendBasicResponse } = require("../../helpers/response")
const { UserModel } = require("../../models/user")

exports.setOutOfOffice = async (req, res, next) => {
    try {
        const {startDate, endDate, substitute} = req.body

        if (!startDate || !endDate || !substitute) {
            next(new Error400Handler("You need to select a start date, an end date and a substitute."))
        }

        //Check if substitute is a valid user
        const substituteRecord = await UserModel.findOne({_id: substitute._id})

        if (!substituteRecord || substituteRecord.isSuspended) {
           throw new Error400Handler("The selected substitute is not a valid user or their account has been suspended. Please select another user.")
        }
        

        const user = req.user
        const userRecord = await UserModel.findOne({uid: user.uid})

        const updatedUser = await UserModel.findOneAndUpdate({uid: user.uid}, {outOfOffice: {startDate, endDate, substitute}}, {new: true})

        const updatedStaffRecord = await UserModel.findOneAndUpdate({_id: substitute._id}, {substituting: userRecord._id, tempRole: userRecord.role}, {new: true})

        //Send email to substitute and admin
        const sendApproverEmail = await sendMail({
            to: updatedStaffRecord.email,
            // bcc: req.user.email,
            subject: "Out Of Office Notification",
            html: setAsSubstituteTemplate({staffName: userRecord.name, substituteName: substitute.name}).html,
            text: setAsSubstituteTemplate({staffName: userRecord.name, substituteName: substitute.name}).text
        })

        sendBasicResponse(res, updatedUser)
        
    }
    catch (error) {
       next(error)
    }
 }
 
 exports.setInOffice = async (req, res, next) => {
    try {
        //Get user record
        const user = req.user

        //Get user record
        const userRecord = await UserModel.findOne({uid: user.uid})

        //Update user record if they contain an out of office object
        if (userRecord.outOfOffice) {

            //Update user record
            const updatedUserRecord = await UserModel.findOneAndUpdate({uid: user.uid}, {outOfOffice: null}, {new: true})

            //Update substitute record
            const updatedSubstituteRecord = await UserModel.findOneAndUpdate({_id: userRecord?.outOfOffice?.substitute?._id}, {substituting: null, tempRole: null}, {new: true})
            
            sendBasicResponse(res, updatedUserRecord)
        } else {
            next(new Error400Handler("You are not currently out of office."))
        }
        
    }
    catch (error) {
       next(error)
    }
 }