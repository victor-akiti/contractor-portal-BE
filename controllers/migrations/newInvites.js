const { admin } = require("../../auth/initializeFirebase")
const { Invite } = require("../../models/invite")
const { listOfRegistrationRequests } = require("./registrationRequestsList")

exports.migrateRegistrationRequests = async (req, res, next) => {
    try {
    migrateExportedInvitesToMongoDB()
    
    } catch (error) {
        next(error)
    }
}

const exportRegistrationRequests = async () => {
        const data = await (await admin.firestore().collection("registrationRequests").get()).docs

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


      fs.writeFileSync(path.join(__dirname, "./registrationRequestsList.js"), JSON.stringify(remappedUserdata))
}

const migrateExportedInvitesToMongoDB = async () => {
    Invite.insertMany(listOfRegistrationRequests).then((result) => {
        console.log({result});
        console.log("Finished");
    }).catch((error) => {
        console.log({error});
    })
}