const { sendBasicResponse } = require("../../helpers/response");
const { FormModel } = require("../../models/form");

exports.createNewForm = async (req, res, next) => {
  try {
    const {form} = req.body


    const newForm = new FormModel({
      form,
      formCreator: {
        name: req.user.name,
        email: req.user.email,
        uid: req.user.uid
      }
    })

    //Save new form
    const savedForm = await newForm.save()

    if (savedForm) {
      sendBasicResponse(res, savedForm)
    }
  } catch (error) {
    next(error);
  }
};

exports.createDuplicateForm = async (req, res, next) => {
  try {
    const {formID} = req.params

    //Confirm that form exists
    const form = await FormModel.findOne({_id: formID})
    const duplicateFormData = {...form._doc}

    delete duplicateFormData._id

    duplicateFormData.formCreator = {
      name: req.user.name,
      email: req.user.email,
      uid: req.user.uid
    }

    duplicateFormData.form.name = `Copy of ${duplicateFormData.form.name}`

    duplicateFormData.modificationHistory = []

    delete duplicateFormData.createdAt
    delete duplicateFormData.updatedAt


    //Create new form object from duplicateFormData 
    const newForm = new FormModel(duplicateFormData)

    //Save new form
    const savedForm = await newForm.save()

    const allForms = await FormModel.find()

    if (savedForm) {
      sendBasicResponse(res, allForms)
    } else {
      throw new Error500Handler("An error occured and the form couldn't be duplicated. Please try again later.")
    }

    
  } catch (error) {
    next(error)
  }
}
