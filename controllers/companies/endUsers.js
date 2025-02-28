const { sendBasicResponse } = require("../../helpers/response");
const { Company } = require("../../models/company");
const { UserModel } = require("../../models/user");

exports.replaceEndUser = async (req, res, next) => {
    try {
        
        const { companyID } = req.params
        const {updatedEndUsersList} = req.body

        console.log({companyID, updatedEndUsersList});

        //Confirm that Company exists
        const company = await Company.findOne({_id: companyID})

        if (!company) {
            throw new Error404Handler("The company you're trying to update does not exist.")
        }

        //Update current end users
        const updatedCompany = await Company.findOneAndUpdate({_id: companyID}, {currentEndUsers: updatedEndUsersList})

        if (updatedCompany) {
            let currentEndUsers = []

            for (let index = 0; index < updatedEndUsersList.length; index++) {
                const element = updatedEndUsersList[index];

                const endUser = await UserModel.findOne({_id: element})

                if (endUser) {
                    currentEndUsers.push(endUser)
                }
                
            }

            console.log({currentEndUsers});
            
            sendBasicResponse(res, {
                currentEndUsers,
                updatedEndUsersList
            })
        }
        

        
        
    } catch (error) {
        next(error)
    }
}

exports.addEndUser = async (req, res, next) => {
    try {
        const {newEndUserID} = req.body
        const { companyID } = req.params

        //Confirm that Company exists
        const company = await Company.findOne({_id: companyID})

        //Confirm that End User exists
        const endUser = await UserModel.findOne({_id: newEndUserID})

        if (!endUser) {
            throw new Error404Handler("The end user you're trying to add does not exist.")
        }

        if (!company) {
            throw new Error404Handler("The company you're trying to update does not exist.")
        }

        //Add new end user
        const updatedCompany = await Company.findOneAndUpdate({_id: companyID}, {$push: {currentEndUsers: newEndUserID}})

        if (updatedCompany) {
            let currentEndUsers = updatedCompany.currentEndUsers

            currentEndUsers.push(newEndUserID)

            const newCurrentEndUsers = []

            for (let index = 0; index < currentEndUsers.length; index++) {
                const element = currentEndUsers[index];

                const endUser = await UserModel.findOne({_id: element})

                if (endUser) {
                    newCurrentEndUsers.push(endUser)
                }
                
            }



            sendBasicResponse(res, {
                currentEndUsers: newCurrentEndUsers,
                updatedEndUsersList: currentEndUsers
            })
            
        }
        
        
    } catch (error) {
        next(error)
    }
}

exports.removeEndUser = async (req, res, next) => {
    try {
        const {companyID} = req.params
        const {endUserID} = req.body

        //Confirm that Company exists
        const company = await Company.findOne({_id: companyID})

        if (!company) {
            throw new Error404Handler("The company you're trying to update does not exist.")
        }

        //Remove end user
        //@ts-ignore
        const updatedCompany = await Company.findOneAndUpdate({_id: companyID}, {$pull: {currentEndUsers: endUserID}}, {new: true})

        if (updatedCompany) {
            let currentEndUsers = updatedCompany.currentEndUsers

            const newCurrentEndUsers = []

            for (let index = 0; index < currentEndUsers.length; index++) {
                const element = currentEndUsers[index];

                const endUser = await UserModel.findOne({_id: element})

                if (endUser) {
                    newCurrentEndUsers.push(endUser)
                }
                
            }

            sendBasicResponse(res, {
                currentEndUsers: newCurrentEndUsers,
                updatedEndUsersList: currentEndUsers
            })
        }
        
    } catch (error) {
        next(error)
    }
}