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
