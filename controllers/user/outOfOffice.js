const { Error400Handler } = require("../../errorHandling/errorHandlers")
const { setAsSubstituteTemplate } = require("../../helpers/emailTemplates")
const { sendBasicResponse } = require("../../helpers/response")
const { UserModel } = require("../../models/user")

exports.setOutOfOffice = async (req, res, next) => {
    try {
        const {startDate, endDate, substitute} = req.body

        if (!startDate || !endDate || !substitute) {
            next(new Error400Handler("You need to select a start date, an end date and a substitute."))
        }

        const user = req.user
        const userRecord = await UserModel.findOne({uid: user.uid})

        const updatedUser = await UserModel.findOneAndUpdate({uid: user.uid}, {outOfOffice: {startDate, endDate, substitute}}, {new: true})

        const updatedStaffRecord = await UserModel.findOneAndUpdate({uid: substitute._id}, {substituting: userRecord._id, tempRole: userRecord.role}, {new: true})

        //Send email to substitute and admin
        const sendApproverEmail = await sendMail({
            to: "",
            // bcc: req.user.email,
            subject: getEmailSubject(currentLevel, company.companyName),
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
    try {}
    catch (error) {
       next(error)
    }
 }