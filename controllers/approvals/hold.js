const { default: mongoose } = require("mongoose");
const { Error404Handler } = require("../../errorHandling/errorHandlers");
const { recommendForHoldEmailTemplate } = require("../../helpers/emailTemplates");
const { createNewEvent, eventDefinitions, approvalStages } = require("../../helpers/eventHelpers");
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
            "flags.status": "park requested",
            "flags.hold": {
                reason: req.body.reason,
                requestedBy: {
                    name: req.user.name,
                    email: req.user.email,
                    date: new Date()
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
        createNewEvent(user._id, user.name, user.role, company._id, company.companyName, eventDefinitions.holdRequest, {
            reason: req.body.reason
        }, "requested hold")
        
    } catch (error) {
        next(error)
    }
}

exports.approveApplicationForHold = async (req, res, next) => {
    try {
        const {vendorID} = req.params
        const user = req.user

        //Check if vendor records exist. If they don't return an error
        const vendor = await VendorModel.findOne({_id: vendorID})

        const company = await Company.findOne({vendor: vendor._id})

        console.log({vendor, company});
        if (!vendor || !company) {
            throw new Error404Handler("The vendor whose application you're trying to put on hold does not exist anymore.")
        }

        //If records exists, update flags to show company as parked
        const parkedVendor = await Company.findOneAndUpdate({vendor: new mongoose.Types.ObjectId(vendorID)}, {"flags.status": "parked", $push: {
            approvalHistory: {
                date: Date.now(),
                action: `Parked at L2`,
                approverName: req.user.name,
                approverEmail: req.user.email
            }
        }})


        const userRecord = await UserModel.findOne({uid: user.uid})

        console.log({userRecord});
        let currentStage = 0

        if (!company?.flags?.approvals?.level && !company?.flags?.level) {
            currentStage = 0
        } else  if (company?.flags?.approvals?.level) {
            currentStage = company?.flags?.approvals?.level
        } else if (company.flags.level) {
            currentStage = company.flags.level
        }

        
        sendBasicResponse(res, {})
        createNewEvent(userRecord._id, userRecord.name, userRecord.role, company._id, company.companyName, eventDefinitions.approvals[approvalStages[currentStage]].parked, {}, "approved hold request" )
        


        
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

exports.placeDirectlyOnHold = async (req, res, next) => {
    try {
        let {reason} = req.body
        let {vendorID} = req.params
        let currentLevel = 0

        const vendor = await VendorModel.findOne({_id: vendorID})
        const company = await Company.findOne({vendor: vendor._id})

        const user = req.user

        //Check if vendor records exist. If they don't return an error
        if (!vendor || !company) {
            throw new Error404Handler("The vendor whose application you're trying to put on hold does not exist anymore.")
        }

        if (!company?.flags?.approvals?.level && !company?.flags?.level) {
            currentLevel = 0
        } else  if (company?.flags?.approvals?.level) {
            currentLevel = company?.flags?.approvals?.level
        } else if (company.flags.level) {
            currentLevel = company.flags.level
        
        }

        const userRecord = await UserModel.findOne({uid: user.uid})

        let newFlags = {...company.flags}
        newFlags.status = "parked"

        if (!newFlags.park) {
            newFlags.park = {}
        }

        if (!newFlags.park[`level${currentLevel}`]) {
            newFlags.park[`level${currentLevel}`] = {}
        }

        newFlags.park[`level${currentLevel}`]["parkRecord"] = {
            date: Date.now(),
                action: `Parked at L2`,
                parkedBy: userRecord._id,
                name: req.user.name,
                email: req.user.email,
                reason
        }



        //If records exists, update flags to show company as parked
        const parkedVendor = await Company.findOneAndUpdate({vendor: new mongoose.Types.ObjectId(vendorID)}, {flags: newFlags,
             $push: {
            approvalHistory: {
                date: Date.now(),
                action: `Parked at L2`,
                approverName: req.user.name,
                approverEmail: req.user.email
            }
        }})

        sendBasicResponse(res, {})

        createNewEvent(userRecord._id, userRecord.name, userRecord.role, company._id, company.companyName, eventDefinitions.placeDirectlyOnHold, {}, "placed directly on hold" )
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