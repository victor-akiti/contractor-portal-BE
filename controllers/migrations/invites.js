const { admin } = require("../../auth/initializeFirebase")
const { Error400Handler } = require("../../errorHandling/errorHandlers")
const { sendBasicResponse } = require("../../helpers/response")
const { Invite } = require("../../models/invite")
const { listOfNewRequests } = require("./registrationRequests")

exports.migrateNewRequests = async (req, res, next) => {
    try {

    migrateExportedInvitesToMongoDB()
    
    } catch (error) {
        next(error)
    }
}

const exportNewRequests = async () => {
    const data = await (await admin.firestore().collection("newRequests").get()).docs

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


  fs.writeFileSync(path.join(__dirname, "./registrationRequests.js"), JSON.stringify(remappedUserdata))
}

const migrateExportedInvitesToMongoDB = async () => {
    console.log({listOfNewRequests: listOfNewRequests.length});
Invite.insertMany(listOfNewRequests).then((result) => {
    console.log({result});
    console.log("Finished");
}).catch((error) => {
    console.log({error});
})
}

exports.findInvitedCompany = async (req, res, next) => {
    try {

        const {queryString} = req.body

        if (!queryString) {
            throw new Error400Handler("Enter a company name to search")
        }


        const results = await Invite.find({
            companyName: {$regex: queryString, $options: "i"}
        })

        let resultsList = []

        if (results.length > 0) {
            resultsList = results.sort((a, b) => {
                if (a.companyName < b.companyName) {
                    return -1;
                  }
                  if (a.companyName > b.companyName) {
                    return 1;
                  }
                  return 0;
            })
        }

        sendBasicResponse(res, {companies: resultsList})


    } catch (error) {
        next(error)
    }
}
