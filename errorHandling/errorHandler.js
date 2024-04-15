class BaseErrorHandler extends Error {

    constructor (name, errorCode, isOperational, description) {
        super(description)

        Object.setPrototypeOf(this, new.target.prototype)

        this.name = name
        this.isOperational = isOperational
        this.errorCode = errorCode

        Error.captureStackTrace(this)
    }
}

module.exports = BaseErrorHandler