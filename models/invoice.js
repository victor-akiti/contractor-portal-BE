const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    CONTRACTOR_NAME: {
        type: String
    },
    DOCUMENT_TYPE:{
        
    },
    DOCUMENT_TITLE: {

    },
    STATUS:{

    },
    DOCUMENT_NUMBER:{
        
    },
    AMNI_ENTITY:{

    },
    CONTRACT_VALUE:{

    },
    STORE_USER:{

    },
    TENDER_STRATEGY:{

    },
    COMPLIED_WITH_C_P1:{

    },
    NON_COMPLIANCE:{

    },
    CURRENCY:{

    },
    SPONSORING_DEPARTMENT:{

    },
    COMMENT:{

    },
    CONTRACT_NUMBER:{

    },
    PR_NUMBER:{

    },
    DEPARTMENT:{

    },
    BUDGET_CODE:{

    },
    OTHER_DOCUMENT_TYPE:{

    },
    OTHER_CURRENCY:{

    },
    ITEM_NUMBER:{

    },
    UAP_CODE:{

    },
    HR_BUDGET_CODE:{

    },
    ICT_BUDGET_CODE:{

    },
    IM_BUDGET_CODE:{

    },
    C_P_BUDGET_CODE:{

    },
    LEGAL_BUDGET_CODE:{

    },
    INSURANCE_BUDGET_CODE:{

    },
    QHSSEC_CODE:{

    },
    IC_RM_CODE:{

    },
    COMMUNICATION_CODE:{

    },
    CIU_BUDGET_CODE:{

    },
    HR_SPU:{

    },
    IT_SPU:{

    },
    IM_SPU:{

    },
    INSURANCE_SPU:{

    },
    COMMUNICATION_SPU:{

    },
    C___P_SPU:{

    },
    AUDIT_SPU:{

    },
    RM_SPU:{

    },
    LEGAL_SPU:{

    },
    FINANCE_SPU:{

    },
    SUBSURFACE_SPU:{

    },
    DRILLING_SPU:{

    },
    RATE_SCHEDULE:{

    },
    PROJECT_SPU:{

    },
    PROJECT_CODE:{

    },
    MSA_TYPE:{

    },
    ADVANCE_PAYMENT:{

    },
    GBC_NUMBER:{

    },
    GBC_MEETING_LINK:{

    },
    EXPORT_FUNDING:{

    },
    EXT_RELATION_SPU:{

    },
    EXT_RELATION_CODE:{

    },
    OTHER_CONTRACT_VALUE:{

    },
    OTHER_CURRENCY_REQUIRED:{

    },
    DWEXTENSION:{

    },
    DWDOCSIZE:{

    },
    DWDOCID:{

    },
    DWSECTIONCOUNT:{

    },
    DWSTOREDATETIME:{

    },
    DWSTOREUSER:{

    },
    DWMODDATETIME:{

    },
    DWMODUSER:{

    },
    DWSYS_DOC_URL:{

    },
    DWSYS_FC_GUID:{

    },
    DWSYS_ORG_NAME:{

    },
    DWSYS_ORG_DOMAIN:{

    },
    DWSYS_ORG_GUID:{

    },
    USED: {
        type: Boolean,
        default: false
    },
    INVOICE_CODE: {
        type: String,
        required: true
    },
    CONTRACTOR_EMAIL: {
        type: String
    }, 
    TIN: {
        type: String
    }, 
    INVOICE_NUMBER: {
        type: String
    }, 
    PAYMENT_OPTION: {
        type: String
    }, 

    INVOICE_DATE: {
        
    },
    CALL_OFF_NUMBER: {

    }
    }, {timestamps: true})

    const InvoiceFormModel = mongoose.model("InvoiceForm", Schema)

module.exports = {
    InvoiceFormModel
}