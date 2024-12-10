const { CompanyOld } = require("../../models/companyOld");

exports.migrateCompanies = async (req, res, next) => {
    try {

        const {allCompanies} = require("../../files/misc/allCompaniesList")

        console.log({allCompaniesLength : allCompanies.length});

        CompanyOld.insertMany(allCompanies).then((result) => {
            console.log({result});
        }).catch((error) => {
            console.log({error});
        })
        
        
    
    } catch (error) {
        next(error)
    }
}

const exportCompanies = async () => {
                const data = await (await admin.firestore().collection("companies").get()).docs

      let remappedUserdata = []

      data.forEach(item => {
         let dataItem = {...item.data()}
         remappedUserdata.push(dataItem)
      })

      const fs = require("fs")
      const path = require("path")

      const dataJSON = JSON.stringify(remappedUserdata)
    let fullCompanyFields = {}

    for (let index = 0; index < allCompanies.length; index++) {
        const element = allCompanies[index];

        fullCompanyFields = {...fullCompanyFields, ...element}
        
    }


      fs.writeFileSync(path.join(__dirname, "./fullCompanyFields.js"), JSON.stringify(fullCompanyFields))
}

const migrateExportedCompaniesToMongoDB = async () => {
    Company.insertMany(allCompanies).then((result) => {
        console.log({result});
    }).catch((error) => {
        console.log({error});
    })
}