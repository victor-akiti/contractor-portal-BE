const { Company } = require("../models/company");
const { NotificationModel } = require("../models/notifications");

const createNotification = async (vendorID, action) => {
    //Get vendor details
    //Get company details
    console.log({vendorID, action});
    const company = await Company.findOne({vendor: vendorID})
    console.log({company});
    const createNewNotification = new NotificationModel({
        vendor: vendorID,
        company: company._id,
        action,
        companyName: company.companyName,
        user: company.userID
    })

    const newNotification = await createNewNotification.save()

    console.log({newNotification});
}

module.exports = {
    createNotification
}