const { recommendForHoldEmailTemplate } = require("../../helpers/emailTemplates");
const { createNewEvent } = require("../../helpers/eventHelpers");
const { sendMail } = require("../../helpers/mailer");
const { sendBasicResponse } = require("../../helpers/response");
const { Company } = require("../../models/company");
const { UserModel } = require("../../models/user");
const { VendorModel } = require("../../models/vendor");

exports.recommendApplicationForHold = async (req, res, next) => {
    try {
        //Confirm that application exists
        const {vendorID} = req.params
        const vendor = await VendorModel.findOne({_id: vendorID})

        const company = await Company.findOne({vendor: vendor._id})

        console.log({vendor, company});
        

        //Update application
        const updatedVendorData = await VendorModel.findOneAndUpdate({_id: vendor._id}, {
            "form.pages": req.body.pages
        })

        //Get HOD/Supervisor account
        const supervisorAccount = await UserModel.findOne({role: "Supervisor"})
        const hodAccount = await UserModel.findOne({role: "HOD"})
        

        const supervisors = []

        let endUsersHistory = []

        if (supervisorAccount) {
            supervisors.push(supervisorAccount._id)
            endUsersHistory.push({
                supervisorID: supervisorAccount._id,
                superVisorName: supervisorAccount.name,
                stage: "A",
                type: "hold approval",
                supervisorEmail: supervisorAccount.email,
                date: Date.now(),
                recommendedBy: "System"
            })
        }

        if (hodAccount) {
            supervisors.push(hodAccount._id)

            endUsersHistory.push({
                supervisorID: hodAccount._id,
                superVisorName: hodAccount.name,
                stage: "A",
                type: "hold approval",
                supervisorEmail: hodAccount.email,
                date: Date.now(),
                recommendedBy: "System"
            })
        }

        
        

        console.log({updatedVendorData, user: req.user});
        //Update vendor company flags
        const updatedCompany = await Company.findOneAndUpdate({_id: company._id}, {
            "flags.stage": "recommended for hold",
            "flags.hold": {
                reason: req.body.reason,
                requestedBy: {
                    name: req.user.name,
                    email: req.user.email
                }
            },
            currentEndUsers: supervisors,
            endUsers: [...company.endUsers, ...endUsersHistory],
            $push: {approvalHistory: {
                date: Date.now(),
                action: "Recommended for hold",
                userName: req.user.name,
                userEmail: req.user.email,
                reason: req.body.reason
            }}
        })

        
        //Send supervisors email
        const sendApproverEmail = await sendMail({
            to: supervisorAccount.email,
            cc: req.user.email,
            bcc: hodAccount.email,
            subject: `Registration for ${company.companyName} has been recommended for L2 hold`,
            html: recommendForHoldEmailTemplate({
                name: req.user.name,
                companyName: company.companyName,
                vendorID,

            }).html,
            text: recommendForHoldEmailTemplate({
                name: req.user.name,
                companyName: company.companyName,
                vendorID,
            }).text
        })

        if (sendApproverEmail[0].statusCode === 202 || sendApproverEmail[0].statusCode === "202") {
            //Create event
            sendBasicResponse(res, {})
        }

        const user = await UserModel.findOne({uid: req.user.uid})

        //Create event
        createNewEvent(user._id, user.name, user.role, vendor._id, company.companyName, 2, {
            reason: req.body.reason
        })
        
    } catch (error) {
        next(error)
    }
}

exports.approveApplicationForHold = async (req, res, next) => {
    try {
        const {vendorID} = req.params
        const vendor = await VendorModel.findOne({_id: vendorID})

        const company = await Company.findOne({vendor: vendor._id})
    } catch (error) {
        next(error)
    }
}

exports.cancelHoldRequest = async (req, res, next) => {
    try {
        const {vendorID} = req.params
        const vendor = await VendorModel.findOne({_id: vendorID})

        const company = await Company.findOne({vendor: vendor._id})
    } catch (error) {
        next(error)
    }
}

exports.revertFromHold = async (req, res, next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}