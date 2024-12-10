const { EventModel } = require("../models/events")

const approvalStageDefinitions = [
    "Stage A Completed - Processed to Stage B",
    "Stage A Return - Returned To Vendor",
    "Stage A Park - Requested to be Parked at L2",
    "Stage A Park - Approved to be parked at L2",
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

const eventDefinitions = {
    approvals: {
        a: {
            progress: "Stage A Completed - Processed to Stage B",
            park: "Stage A Park - Approved to be parked at L2"
        },
        b: {
            progress: "Stage B Completed - Processed to Stage C",
            parked: "Stage B Park - Approved to be parked at L2"
        },
        c: {
            progress: "Stage C Completed - Processed to Stage D",
            parked: "Stage C Park - Approved to be parked at L2"
        },
        d: {
            progress: "Stage D Completed - Processed to Stage E",
            parked: "Stage D Park - Approved to be parked at L2"
        },
        e: {
            progress: "Stage E Completed - Processed to Stage F",
            parked: "Stage E Park - Approved to be parked at L2"
        },
        f: {
            progress: "Stage F Completed - Processed to Stage G",
            parked: "Stage F Park - Approved to be parked at L2"
        },  
        g: {
            progress: "Stage G Completed - Processed to L3",
            parked: "Stage G Park - Approved to be parked at L2"
        },
        ndpr: "Approved NDPR removal"
    },
    declines: {
        a: {
            park: "Stage A Park - Declined request to park at L2"
        },
        b: {
            park: "Stage B Park - Declined request to park at L2"
        },
        c: {
            park: "Stage C Park - Declined request to park at L2"
        },
        d: {
            park: "Stage D Park - Declined request to park at L2"
        },
        e: {
            park: "Stage E Park - Declined request to park at L2"
        },
        f: {
            park: "Stage F Park - Declined request to park at L2"
        },
        g: {
            park: "Stage G Park - Declined request to park at L2"
        }
    },
    returns: {
        a: {
            application: "Stage A Return - Returned To Vendor"
        },
        b: {
            application: "Stage B Return - Returned To Vendor"
        },
        c: {
            application: "Stage C Return - Returned To Vendor"
        }, 
        d: {
            application: "Stage D Return - Returned To Vendor"
        },
        e: {
            application: "Stage E Return - Returned To Vendor"
        },
        f: {
            application: "Stage F Return - Returned To Vendor"
        },
        g: {
            application: "Stage G Return - Returned To Vendor"
        }
    },
    requests: {
        ndpr: "Requested NDPR removal"
    },
    retrieve: "Retrieved vendor's application",
    stageReturn: "Returned to application to the previous stage",
    returnedToL2: "Returned application to L2",
    holdRequest: "Requested to put vendor's application on hold",
    holdRequestApproved: "Approved request to put vendor's application on hold",
    holdRequestDeclined: "Declined request to put vendor's application on hold",
    placeDirectlyOnHold: "Placed vendor's application directly on hold",
    misc: {
        registration: {
            reminderSent: "Registration reminder sent",
            linkRenewed: "Registration link renewed"
        },
        vendorAction: {
            certificateUpdate: "Certificate Updated",
            submission: "Application submitted"
        },
        staffAction: {
            inviteSent: "Invite sent to vendor"
        }
    }
}

const getApprovalStageText = index => {
    return approvalStageDefinitions[index]
}

const createNewEvent = async (userID, userName, userRole, vendorID, vendorName, eventDescription, extraData, type) => {
    console.log({eventDescription});
    
    let newEvent = new EventModel({
        userID,
        userName,
        userRole,
        vendorName,
        eventDescription,
        extraData,
        type: type ? type: "other"
    })

    if (vendorID) {
        newEvent["vendorID"] = vendorID
    }

    const savedNewEvent = await newEvent.save()

    console.log({savedNewEvent});
    
}

const approvalStages = ["a", "b", "c", "d", "e", "f", "g"]

module.exports = {
    getApprovalStageText,
    createNewEvent,
    eventDefinitions,
    approvalStages
}