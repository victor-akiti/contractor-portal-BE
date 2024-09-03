const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    form: {
        type: Object,
        required: true
    },
    formCreator: {
        type: Object,
        required: true
    },
    modificationHistory: {
        type: Array
    }
}, {timestamps: true})

const FormModel = mongoose.model("Form", Schema)

module.exports = {
    FormModel
}