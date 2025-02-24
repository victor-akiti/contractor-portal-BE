const { default: mongoose } = require("mongoose");
const { Error500Handler } = require("../../errorHandling/errorHandlers");
const { endUserNotificationTemplate, applicationNeedingAttentionTemplate } = require("../../helpers/emailTemplates");
const { createNewEvent, eventDefinitions, approvalStages } = require("../../helpers/eventHelpers");
const { sendMail } = require("../../helpers/mailer");
const { sendBasicResponse } = require("../../helpers/response");
const { Company } = require("../../models/company");
const { UserModel } = require("../../models/user");
const { VendorModel } = require("../../models/vendor");
const { importRandomStringGen } = require("../../helpers/randomTextGen");

exports.processApplicationToNextStage = async (req, res, next) => {
    
    
    try {
        const {vendorID} = req.params

        const company = await Company.findOne({_id: vendorID})
        const vendor = await VendorModel.findOne({_id: company.vendor})

        

        console.log({company});
        
        const usersToMail = []
        
        let currentLevel = 0
        let nextLevel = 0
        let approvals = {}
        let endUsers = []
        let currentEndUsers = []
        let currentServices = []
        let eventType = "processed"
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

        

        //Update application
        if (req.body.pages) {
            const updatedVendorData = await VendorModel.findOneAndUpdate({_id: vendor._id}, {
                "form.pages": req.body.pages
            })
        }


        if (company?.flags?.approvals) {
            approvals = {...company?.flags?.approvals}
        }

        approvals[`level${currentLevel}`] = {
            level: currentLevel,
            approver: user,
            approved: true,
            date: new Date()
        }

        let companyUpdateData = {
            "flags.level": nextLevel,
            "flags.approvals": approvals,
            "flags.stage": "submitted",
            // jobCategories: currentServices.length > 0 ? currentServices : null,
        }


        if (currentLevel === 0) {
            const contractsOfficers = await UserModel.find({role: "Supervisor"})
            const cnpHOD = await UserModel.findOne({role: "HOD"})

            for (let index = 0; index < contractsOfficers.length; index++) {
                const element = contractsOfficers[index];

                currentEndUsers.push(String(element._id))
                usersToMail.push(element)
                
            }

            if (cnpHOD) {
                currentEndUsers.push(String(cnpHOD._id))
                usersToMail.push(cnpHOD)
            }

            
            
        } else if (currentLevel === 1) {
            const {selectedEndUsers} = req.body
            for (let index = 0; index < selectedEndUsers.length; index++) {
                const element = selectedEndUsers[index];

                currentEndUsers.push(String(element._id))
                usersToMail.push(element)
                
            }
        } else if (currentLevel === 2) {
            const {selectedServices, siteVisitRequired} = req.body

            if (company.jobCategories) {
                currentServices = [...company.jobCategories]
            }

            let stringsOfCurrentCategories = []

            for (let index = 0; index < currentServices.length; index++) {
                const element = currentServices[index];
                stringsOfCurrentCategories.push(element.category)
            }

            for (let index = 0; index < selectedServices.length; index++) {
                const element = selectedServices[index];

                if (!stringsOfCurrentCategories.includes(element.category)) {
                    currentServices.push({
                        category: element.category,
                        addedBy: {
                            name: user.name,
                            _id: user._id
                        }
                    })
                }
                
            }

            companyUpdateData = {
                ...companyUpdateData,
                jobCategories: currentServices,
                "flags.siteVisitRequired": siteVisitRequired,
            }

            //Get supervisors
            const supervisorAccount = await UserModel.find({$or: [{role: "Supervisor"}, {role: "GM"}, {role: "HOD"}]})
            

            if (supervisorAccount.length > 0) {
                for (let index = 0; index < supervisorAccount.length; index++) {
                    const element = supervisorAccount[index];
                    currentEndUsers.push(element._id)
                    usersToMail.push(element)
                }
            }
        } else if (currentLevel === 3) {
            let {dueDiligence} = req.body
            companyUpdateData = {
                ...companyUpdateData,
                dueDiligence
            }

            const hodAccount = await UserModel.findOne({role: "HOD"})

            console.log({hodAccount});
            

            if (hodAccount) {
                currentEndUsers.push(String(hodAccount._id))
                usersToMail.push(hodAccount)
            }
            
        } else if (currentLevel === 4) {
            const {hodRemarkForEA} = req.body
            companyUpdateData = {
                ...companyUpdateData,
                "flags.hodRemarkForEA": hodRemarkForEA
            }

            const executiveApprover = await UserModel.findOne({role: "Executive Approver"})

            console.log({executiveApprover});
            
            

            if (executiveApprover) {
                currentEndUsers.push(String(executiveApprover._id))
                usersToMail.push(executiveApprover)
            }
        } else if (currentLevel === 5) {
            companyUpdateData = {
                ...companyUpdateData,
                "flags.status": "approved",
                "flags.approved": true
            }
            eventType = "approved"
        }




        

        //Update company
        const updatedCompanyData = await Company.findOneAndUpdate({_id: company._id}, {
            ...companyUpdateData,
            $push: {
                approvalHistory: {
                    date: Date.now(),
                    action: `Completed Stage ${stages[currentLevel].stageLevel}, processed to Stage ${stages[currentLevel + 1].stageLevel}`,
                    approverName: req.user.name,
                    approverEmail: req.user.email
                }
            },
            currentEndUsers: currentEndUsers.length > 0 ? currentEndUsers : null
        })

        
        //Send emails
        for (let index = 0; index < usersToMail.length; index++) {
            const element = usersToMail[index];
            
            const sendApproverEmail = await sendMail({
                to: element.email,
                // bcc: req.user.email,
                subject: getEmailSubject(currentLevel, company.companyName),
                html: getEmailTemplate(currentLevel, company.companyName, element.name).html,
                text: getEmailTemplate(currentLevel, company.companyName, element.name).text
            })
      
        }

        sendBasicResponse(res, {})



        //Create event
        createNewEvent(user._id, user.name, user.role, company._id, company.companyName, eventDefinitions.approvals[approvalStages[currentLevel]].progress, {}, eventType)

        
        
    } catch (error) {
        next(error)
    }
}

const getEmailSubject = (stage, companyName) => {
    console.log({stage, companyName});
    
    if (stage === 1) {
        return `Registration for ${companyName} is waiting for your review`
    } else if (stage === 3) {
        return `Due Diligence check for ${companyName} is waiting for your approval`
    } else if (stage === 4) {
        return ` ${companyName} is waiting for your final approval`
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

const getEmailTemplate = (stage, companyName, endUserName) => {
    console.log({companyName});
    
    if (stage === 1) {
        return endUserNotificationTemplate(endUserName, companyName)
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
        const {vendorID} = req.params

        if (!vendorID) {

            throw new Error400Handler("Vendor ID is required")
        }

        const {revertReason} = req.body

        if (!revertReason) {

            throw new Error400Handler("Revert reason is required")
        }   

        const company = await Company.findOne({_id: vendorID})

        let flags = {...company.flags}

        if (!flags.reverts) {
            flags.reverts = {}
        }

        if (!flags?.reverts[`stage${flags.level}`]) {
            flags.reverts[`stage${flags.level}`] = {}
        }

        flags.reverts[`stage${flags.level}`]["reasoon"] = revertReason

        flags.level = company.flags.level - 1

        //Update company to revert approval stage to previous

        

        const updatedCompany = await Company.findOneAndUpdate({_id: vendorID}, {
            flags: flags,
            $push: {
                approvalHistory: {
                    date: Date.now(),
                    action: `Reverted to Stage ${String(approvalStages[company.flags.level - 1]).toUpperCase()}, due to ${revertReason}`,
                    approverName: req.user.name,
                    approverEmail: req.user.email
                }
            }
        })

        sendBasicResponse(res, {})
        
        
        
        
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
        console.log({from: req.body.from});
        console.log(req.user);
        const {vendorID} = req.params
        console.log({vendorID});
        
        const {from, reason} = req.body
        const company = await Company.findOne({_id: vendorID})

        console.log({company});
        

        let updatedFlags = {...company.flags}

        updatedFlags.status = "pending"
        updatedFlags.approved = false
        updatedFlags.level = from  === "parked" || from === "park requests" ? company.flags.level : 5

        if (!updatedFlags.revertToL2s) {
            updatedFlags.revertToL2s = {}
        }

        if (from === "parked") {
            if (!updatedFlags.revertToL2s[`stage${updatedFlags.level}`]) {
               updatedFlags.revertToL2s[`stage${updatedFlags.level}`] = {}
            }
            updatedFlags.revertToL2s[`stage${updatedFlags.level}`]["reason"] = reason
            updatedFlags.revertToL2s[`stage${updatedFlags.level}`]["revertedBy"] = req.user
            updatedFlags.revertToL2s[`stage${updatedFlags.level}`]["revertDate"] = Date.now()
        } else {
            if (!updatedFlags.revertToL2s[`l3`]) {
                updatedFlags.revertToL2s[`l3`] = {}
            }
            updatedFlags.revertToL2s[`l3`]["reason"] = reason
            updatedFlags.revertToL2s[`l3`]["revertDate"] = Date.now()
        }
        

        
        const updateVendorAccount = await Company.findOneAndUpdate({_id: req.company._id}, {
            flags: updatedFlags,
            $push: {
                approvalHistory: {
                    date: Date.now(),
                    action: getRevertMessage(req.body.from),
                    approverName: req.user.name,
                    approverEmail: req.user.email
                }
            }
        })

        if (updateVendorAccount) {
            sendBasicResponse(res, {})
        } else {
            throw new Error500Handler("An error occured. Please try again or contact the system administrator.")
        }        
        
    } catch (error) {
        next(error)
    }
}

exports.saveExposedPerson = async (req, res, next) => {
    try {
        console.log(req.body);
        const {vendorID} = req.params
        let dueDiligenceData = {}

        console.log({vendorID});

        if (!vendorID) {
            throw new Error400Handler("Vendor ID is required")
        }

        const company = await Company.findOne({_id: vendorID})

        const vendor = await VendorModel.findOne({_id: company.vendor})

        

        if (!vendor || !company) {
            throw new Error404Handler("The vendor account you're trying to update does not exist.")
        }

        const {exposedPerson} = req.body

        if (exposedPerson._id) {
            //Update exposed person

            dueDiligenceData = {
                exposedPersons: company.dueDiligence.exposedPersons.map((person) => {
                    if (person._id === exposedPerson._id) {
                        return exposedPerson
                    } else {
                        return person
                    }
                })
            }

            const savedExposedPerson = await Company.findOneAndUpdate({_id: company._id}, {
                dueDiligence: dueDiligenceData
            })

            sendBasicResponse(res, {})
        } else {
            //Create exposed person

            //Generate exposed person id
            const cryptoRandomString = await importRandomStringGen()

            if (!company.dueDiligence) {
                dueDiligenceData = {
                    exposedPersons: [{
                        ...exposedPerson,
                        id: cryptoRandomString
                    }]
                }
            } else {
                dueDiligenceData = {
                    exposedPersons: [...company.dueDiligence.exposedPersons, {...exposedPerson, _id: cryptoRandomString}]
                }
            }

            console.log({dueDiligenceData});
            

            //Save exposed person
            const savedExposedPerson = await Company.findOneAndUpdate({_id: company._id}, {
                dueDiligence: dueDiligenceData
            })

            sendBasicResponse(res, {_id: cryptoRandomString})

            console.log({savedExposedPerson});
            
            
        }

        console.log({exposedPerson});
        


        

        // company.exposedPerson = exposedPerson
        // company.save()
        // sendBasicResponse(res, {})
    } catch (error) {
        next(error)
    }
}

exports.removeExposedPerson = async (req, res, next) => {
    try {
        const {vendorID} = req.params

        if (!vendorID) {
            throw new Error400Handler("Vendor ID is required")
        }

        const company = await Company.findOne({_id: vendorID})

        const vendor = await VendorModel.findOne({_id: company.vendor})

        

        if (!vendor || !company) {
            throw new Error404Handler("The vendor account you're trying to update does not exist.")
        }

        const {exposedPersonID} = req.body

        if (!exposedPersonID) {
            throw new Error400Handler("Exposed person ID is required")
        }

        const exposedPersons = company.dueDiligence.exposedPersons.filter(person => person._id !== exposedPersonID)



        const savedExposedPerson = await Company.findOneAndUpdate({_id: company._id}, {
            dueDiligence: {
                exposedPersons
            }
        })

        console.log({savedExposedPerson});
        

        sendBasicResponse(res, {exposedPersons})
        
    } catch (error) {
        next(error)
    }
}

const getRevertMessage = from => {
    if (from === "parked") {
        return 'Reverted to Pending L2 from Parked L2'
    } else if (from === "l3") {
        return 'Reverted to Pending L2 from L3'
    }
}



const processApprovalInL2 = () => {

}
