const { endUserNotificationTemplate, applicationNeedingAttentionTemplate } = require("../../helpers/emailTemplates");
const { createNewEvent } = require("../../helpers/eventHelpers");
const { sendMail } = require("../../helpers/mailer");
const { sendBasicResponse } = require("../../helpers/response");
const { Company } = require("../../models/company");
const { UserModel } = require("../../models/user");
const { VendorModel } = require("../../models/vendor");

exports.processApplicationToNextStage = async (req, res, next) => {
    try {
        const {vendorID} = req.params
        const vendor = await VendorModel.findOne({_id: vendorID})

        const company = await Company.findOne({vendor: vendor._id})
        const usersToMail = []

        let currentLevel = 0
        let nextLevel = 0
        let approvals = []
        let endUsers = []
        let currentEndUsers = []
        const stages = [{
            stageLevel: "A",
            stageApprovalMessageIndex: 0
        }, {
            stageLevel: "B",
            stageApprovalMessageIndex: 6
        },{
            stageLevel: "C",
            stageApprovalMessageIndex: 9
        },{
            stageLevel: "D",
            stageApprovalMessageIndex: 12
        },{
            stageLevel: "E",
            stageApprovalMessageIndex: 15
        },{
            stageLevel: "F",
            stageApprovalMessageIndex: 18
        },{
            stageLevel: "G",
            stageApprovalMessageIndex: 20
        }]

        if (!company?.flags?.level) {
            currentLevel = 0
            nextLevel = 1
        } else {
            currentLevel = company?.flags?.level
            nextLevel = currentLevel + 1
        }

        const user = await UserModel.findOne({uid: req.user.uid})

        if (!company?.flags?.approvals) {
            approvals = [
                {
                    level: currentLevel,
                    approver: user,
                    approved: true,
                    date: new Date()
                }
            ]
        } 
        // else {
        //     approvals = [...company?.flags?.approvals, {
        //             level: currentLevel,
        //             approver: user,
        //             approved: true,
        //             date: new Date()
        //         }]
        // }
        

        //Update application
        if (req.body.pages) {
            const updatedVendorData = await VendorModel.findOneAndUpdate({_id: vendor._id}, {
                "form.pages": req.body.pages
            })
        }

        //If DD, add DD details here


        if (currentLevel === 0) {
            const contractsOfficers = await UserModel.find({role: "CO"})

            for (let index = 0; index < contractsOfficers.length; index++) {
                const element = contractsOfficers[index];

                currentEndUsers.push(element._id)
                usersToMail.push(element)
                
            }
            
        }
        

        

        //Update company
        const updatedCompanyData = await Company.findOneAndUpdate({_id: company._id}, {
            "flags.level": nextLevel,
            "flags.approvals": approvals,
            "flags.stage": "submitted",
            $push: {
                approvalHistory: {
                    date: Date.now(),
                    action: `Completed Stage ${stages[currentLevel].stageLevel}, processed to Stage ${stages[currentLevel + 1].stageLevel}`,
                    approverName: req.user.name,
                    approverEmail: req.user.email
                }
            },
            currentEndUsers
        })

        
        if (currentLevel === 1) {

        }

        //Send emails
        for (let index = 0; index < usersToMail.length; index++) {
            const element = usersToMail[index];
            
            const sendApproverEmail = await sendMail({
                to: element.email,
                // bcc: req.user.email,
                subject: getEmailSubject(currentLevel, company.companyName),
                html: getEmailTemplate(currentLevel, company.companyName).html,
                text: getEmailTemplate(currentLevel, company.companyName).text
            })
      
        }

        sendBasicResponse(res, {})



        //Create event
        createNewEvent(user._id, user.name, user.role, vendorID, vendor.name, stages[currentLevel].stageApprovalMessageIndex)

        
        
    } catch (error) {
        next(error)
    }
}

const getEmailSubject = (stage, companyName) => {
    if (stage === 1) {
        return `Registration for ${companyName} is waiting for your review`
    } else if (stage === 4) {
        `Due Diligence check for ${companyName} is waiting for your approval`
    } else if (stage === 6) {
        ` ${companyName} is waiting for your final approval`
    } else {
        return `Registration for ${companyName} is waiting for your approval`;
    }
}

const getEmailAction = (stage, companyName) => {
    if (stage === 1) {
        return "Registration"
    } else if (stage === 4) {
        return `<p>Due Diligence checks for ${companyName} on Amni's Contractor Registration Portal are waiting for your approval.</p>`;
    } else if (stage === 6) {
        return `<p>The registration for ${companyName} is waiting for your final approval</p>`
    } else {
        return `<p>The application for registration of ${companyName} on Amni's Contractor Registration Portal is waiting for your approval.</p>`;
    }
}

const getEmailTemplate = (stage, companyName) => {
    if (stage === 1) {
        return endUserNotificationTemplate()
    } else if (stage === 4) {
        return applicationNeedingAttentionTemplate({action: getEmailAction(stage, companyName)})
    } else if (stage === 6) {
        return applicationNeedingAttentionTemplate({action: getEmailAction(stage, companyName)})
    } else {
        return applicationNeedingAttentionTemplate({action: getEmailAction(stage, companyName)})
    }
}

exports.revertApplicationToPreviousStage = async (req, res, next) => {
    try {

    } catch (error) {
        next(error)
    }
}



exports.processApplicationToL3 = async (req, res, next) => {
    try {

    } catch (error) {
        next(error)
    }
}

exports.revertApplicationToL2 = async (req, res, next) => {
    try {

    } catch (error) {
        next(error)
    }
}



const processApprovalInL2 = () => {

}
