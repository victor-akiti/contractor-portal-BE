const mongoose = require("mongoose")
const { UserModel } = require("./user")

const Schema = new mongoose.Schema({
    "cacForm7": {
        type: Array
    },
    "website": {
        type: String
    },
    "tinCertificate": {
        type: Array
    },
    "companyName": {
        type: String
    },
    "hqAddress": {
        type: Object
    },
    "companyUID": {
        type: String
    },
    "taxIDNumber": {
        type: String
    },
    "userID": {
        type: String
    },
    "cacForm2A": {
        type: Array
    },
    "secondaryContact": {
        type: Object
    },
    "registeredNumber": {
        type: String
    },
    "cacBNForm1": {
        
    },
    "registrationType": {
        type: String
    },
    "branchAddresses": {
        type: Array
    },
    "companyBrochure": {
        type: Array
    },
    "contractorDetails": {
        type: Object
    },
    "activities": {
        type: Array
    },
    "primaryContact": {
        type: Object
    },
    "certificateOfRegistration": {
        type: Array
    },
    "safetyRecord": {
        type: Object
    },
    "financialPerformance": {
        type: Object
    },
    "insurance": {
        type: Object
    },
    "dpr": {
        type: Object
    },
    "lastUpdate": {
        type: Object
    },
    "flags": {
        type: Object
    },
    "otherCertificates": {
        type: Object
    },
    "updateTime": {
        type: Number
    },
    "submitTime": {
        type: Number
    },
    "approvalInfo": {
        type: Object
    },
    "lastApproved": {
        type: Number
    },
    "returnTime": {
        type: Number
    },
    "endUsers": {
        type: Array
    },
    "enduserApprovalInfo": {
        type: Object
    },
    "jobCategories": {
        type: Array
    },
    "dueDiligence": {
        type: Object
    },
    "hodRemarkForGMD": {
        type: Object
    },
    "gmdDecision": {
        type: Object
    },
    "code": {
        type: String
    },
    "label": {
        type: String
    },
    "gbcMeeting": {
        type: Object
    },
    "flags.completeNotified": {
        type: Boolean
    },
    "certificatesExtracted": {
        type: Boolean
    },
    "enduser": {
        type: Object
    },
    "hodDiligenceRemarks": {
        type: Object
    },
    "vendorAppAdminProfile": {
        type: mongoose.Types.ObjectId,
        ref: UserModel
    },
    "vendor": {
        type: mongoose.Types.ObjectId,
        ref: UserModel
    },
    approvalHistory: {
        type: Array,
        default: []
    }
    
}, {timestamps: true})

const Company = mongoose.model("Company", Schema)

module.exports = {
    Company
}