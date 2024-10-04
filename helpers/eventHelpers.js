const { EventModel } = require("../models/events")

const approvalStageDefinitions = [
    "Stage A Completed - Processed to Stage B",
    "Stage A Return - Returned To Vendor",
    "Stage A Park - Requested to be Parked at L2",
    "Stage B Park - Requested to be Parked at L2",
    "Stage B Park - Approved to be parked at L2",
    "Stage B Return - Returned To Vendor",
    "Stage B Completed - Processed to Stage C - Selected End User to approve",
    "Stage C Park - Requested to be Parked at L2",
    "Stage C Park - Approved to be parked at L2",
    "Stage C Completed - Processed to Stage D - End User approved",
    "Stage D Park - Requested to be Parked at L2",
    "Stage D Park - Approved to be parked at L2",
    "Stage D Completed - Processed to Stage E - Due Diligence Check 1 Passed",
    "Stage E Park - Requested to be Parked at L2",
    "Stage E Park - Approved to be parked at L2",
    "Stage E Completed - Processed to Stage F - Due Diligence Check 2 Passed",
    "Stage F Return - HOD returned application to CO",
    "Stage F Park - Approved to be parked at L2",
    "Stage F Completed - Processed to Stage G - HOD GBC Approved",
    "Stage G Park - Executive Approver Parked at L2",
    "Stage G Completed - Processed to Stage L3 - Executive Approver Approved",
    "Park request approved",   
    "Park request denied",
    "Invite sent",
    "Application submitted",
    "Certificate Updated",
    "Registration reminder sent",
    "Registration link renewed",
    "Requested NDPR removal",
    "Approved NDPR removal"
]

const getApprovalStageText = index => {
    return approvalStageDefinitions[index]
}

const createNewEvent = async (userID, userName, userRole, vendorID, vendorName, approvalStageIndex, extraData) => {
    let newEvent = new EventModel({
        userID,
        userName,
        userRole,
        vendorID,
        vendorName,
        eventIndex: approvalStageIndex,
        eventName: approvalStageDefinitions[approvalStageIndex],
        extraData
    })

    const savedNewEvent = await newEvent.save()

    console.log({savedNewEvent});
    
}

module.exports = {
    getApprovalStageText,
    createNewEvent
}