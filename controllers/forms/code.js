const { importRandomStringGen } = require("../../helpers/randomTextGen");
const { Company } = require("../../models/company");
const { FormModel } = require("../../models/form");
const { VendorModel } = require("../../models/vendor");

exports.generateUniqueCodes = async (req, res, next) => {
    try {
        const {id} = req.params

        //Fetch form
        const form = await FormModel.findOne({_id: id})

        console.log({form});

        //Test code generator
        const randomCode = await importRandomStringGen()
        console.log({randomCode});

        let pages = form.form.pages

        for (let index = 0; index < pages.length; index++) {
            const page = pages[index];
            page["id"] = await importRandomStringGen()

            for (let sectionIndex = 0; sectionIndex < page.sections.length; sectionIndex++) {
                const section = page.sections[sectionIndex];
                section["id"] = await importRandomStringGen()

                for (let fieldIndex = 0; fieldIndex < section.fields.length; fieldIndex++) {
                    const field = section.fields[fieldIndex];
                    field["id"] = await importRandomStringGen()
                }
                
            }
            
        }

        let copiedForm = {...form._doc}

        delete copiedForm._id
        delete copiedForm.createdAt
        delete copiedForm.updatedAt



        const updatedForm = await FormModel.findOneAndUpdate({_id: id}, {"form.pages" : pages})

        console.log({updatedForm});
        
        
        
        
        
        
        
    } catch (error) {
        next(error)
    }
}


exports.generateUniqueCodesForVendors = async (req, res, next) => {
    try {
        const body = req.body
        console.log({body});

        const {selectedVendors} = body

        const baseForm = await FormModel.findOne({_id: "665d87756d714d8c4800fa55"})

        console.log({baseForm});
        

        for (let index = 0; index < selectedVendors.length; index++) {
            const element = selectedVendors[index];

            const company = await Company.findOne({_id: element})

            const vendor = await VendorModel.findOne({_id: company.vendor})

            let migratedForm = baseForm._doc

            let migratedFormPages = migratedForm.form.pages
            const vendorPages = vendor.form.pages
            
            
            
            
        }
        
    } catch (error) {
        next(error)
    }
}