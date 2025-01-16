const { Company } = require("../../models/company");
const { CompanyOld } = require("../../models/companyOld");

exports.migrateCompanies = async (req, res, next) => {
    try {

        const {allCompanies} = require("../../files/misc/allCompaniesList")

        console.log({allCompaniesLength : allCompanies.length});

        Company.insertMany(allCompanies).then((result) => {
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

exports.exportCompanyNamesListToExcel = async (req, res, next) => {
    try {
        const allCompanies = await Company.find({}).lean()

        console.log({allCompanies : allCompanies.length});

        let companies = []

        allCompanies.forEach((company) => {
            companies.push({companyName : String(company.companyName).toLocaleUpperCase()})
        })

        //Sort companies alphabetically
        companies = companies.sort((a, b) => {
            if (a.companyName < b.companyName) {
                return -1;
              }
              if (a.companyName > b.companyName) {
                return 1;
              }
              return 0;
        })

        //Export companies to excel
        const fs = require("fs")
        const path = require("path")

        const csvjson = require("csvjson")

        const csvData = csvjson.toCSV(JSON.stringify(companies), {
            headers: 'key'
        })

        //export companies to CSV

        fs.writeFileSync(path.join(__dirname, "./companiesList.csv"), csvData)

        console.log({companies});
        
        
    } catch (error) {
        next(error)
    }
}