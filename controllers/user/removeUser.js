const { admin } = require("../../auth/initializeFirebase");
const { Error404Handler, Error403Handler, Error500Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { Company } = require("../../models/company");
const { UserModel } = require("../../models/user");

exports.removeUser = async (req, res, next) => {
    try {
        console.log("Removing user");
        const { id } = req.params

        console.log({id});
        

        //Check if the user exists
        const userToDelete = await UserModel.findOne({ _id: id })

        if (!userToDelete) {
            throw new Error404Handler("User not found. The account may already have been deleted.")
        }

        if (userToDelete.role === "Vendor") {
            //Check if the user is a vendor account and if they are actively managing any vendors. If they are, throw an error
            const company = await Company.findOne({vendorAppAdminProfile: userToDelete._id})

            if (company) {
                throw new Error403Handler(`This account currently manages ${company.companyName}'s portal account. Please replace their portal administrator before deleting this account.`)
            } 
        } else {
            //Check if the user is CnP staff with elevated permissions. If they are and they are the only ones occupying that role, throw an error
            if (userToDelete.role === "Admin" || userToDelete.role === "CnP Admin" || userToDelete.role === "VRM" || userToDelete.role === "Executive Approver" || userToDelete.role === "Insurance Officer" || userToDelete.role === "HOD" || userToDelete.role === "IT Admin") {
                throw new Error403Handler(`This account currently holds the role of ${userToDelete.role} and this role cannot be left unfilled. Please replace them as ${userToDelete.role} before deleting this account.`)
            } else if (userToDelete.role === "Supervisor") {
                //Get all supervisors
                const supervisors = await UserModel.find({role: "Supervisor"})

                if (supervisors.length === 1) {
                    throw new Error403Handler(`This account is currently the only one holding the role of ${userToDelete.role} and this role cannot be left unfilled. Please replace them as ${userToDelete.role} or select another user as ${userToDelete.role} before deleting this account.`)
                    
                }
            }

        }

        //Delete the user account
        if (userToDelete.uid) {
            admin.auth().deleteUser(userToDelete.uid).then(async result => {
                //Delete the user data
                const deletedUser = await UserModel.findOneAndDelete({ _id: id })

                if (!deletedUser) {
                    throw new Error404Handler("User not found. The account may already have been deleted.")
                }

                //Send response
                sendBasicResponse(res, {})

                //Create an event
                
            }).catch((error) => {
                throw new Error500Handler("An error occured and the user couldn't be deleted. Please try again later.")
            })


            
            
        }


        

        

        
        
    } catch (error) {
        next(error)
    }
}