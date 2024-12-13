const { admin } = require("../../auth/initializeFirebase")
const { sendBasicResponse } = require("../../helpers/response")
const { Invite } = require("../../models/invite")
const { UserModel } = require("../../models/user")
const { allUsers } = require("./allUsers")
const { listOfRegistrationRequests } = require("./registrationRequestsList")

exports.migrateUsers = async (req, res, next) => {
    try {
    // exportUsers(res)
    migrateExportedUsersToMongoDB(res)
    
    } catch (error) {
        next(error)
    }
}

const exportUsers = async (res) => {
        const data = await (await admin.firestore().collection("users").get()).docs

      let remappedUserdata = []

      data.forEach(item => {
         let dataItem = {...item.data()}
         remappedUserdata.push(dataItem)
      })

      const fs = require("fs")
      const path = require("path")

      const dataJSON = JSON.stringify(remappedUserdata)
    // let fullCompanyFields = {}

    // for (let index = 0; index < allCompanies.length; index++) {
    //     const element = allCompanies[index];

    //     fullCompanyFields = {...fullCompanyFields, ...element}
        
    // }


      fs.writeFileSync(path.join(__dirname, "./allUsers.js"), JSON.stringify(remappedUserdata))

      sendBasicResponse(res, {})
}

const migrateExportedUsersToMongoDB = async (res) => {
    UserModel.insertMany(allUsers).then((result) => {
        console.log({result});
        console.log("Finished");
        sendBasicResponse(res, {message: "Users migrated successfully"})
    }).catch((error) => {
        console.log({error});
    })
}