const { errorCodes } = require("./errorCodes")
const BaseErrorHandler = require("./errorHandler")

class Error400Handler extends BaseErrorHandler {
    constructor (name, errorCode=errorCodes.BAD_REQUEST, isOperational = true, description) {
        super(name, errorCode, isOperational, description)
    }
}

class Error401Handler extends BaseErrorHandler {
    constructor (name, errorCode=errorCodes.UNAUTHORIZED, isOperational = true, description) {
        super(name, errorCode, isOperational, description)
    }
}

class Error403Handler extends BaseErrorHandler {
    constructor (name, errorCode=errorCodes.FORBIDDEN, isOperational = true, description) {
        super(name, errorCode, isOperational, description)
    }
}

class Error404Handler extends BaseErrorHandler {
    constructor (name, errorCode=errorCodes.NOT_FOUND, isOperational = true, description) {
        super(name, errorCode, isOperational, description)
    }
}

class Error405Handler extends BaseErrorHandler {
    constructor (name, errorCode=errorCodes.METHOD_NOT_ALLOWED, isOperational = true, description) {
        super(name, errorCode, isOperational, description)
    }
}

class Error408Handler extends BaseErrorHandler {
    constructor (name, errorCode=errorCodes.REQUEST_TIMEOUT, isOperational = true, description) {
        super(name, errorCode, isOperational, description)
    }
}


class Error410Handler extends BaseErrorHandler {
    constructor (name, errorCode=errorCodes.GONE, isOperational = true, description) {
        super(name, errorCode, isOperational, description)
    }
}

class Error500Handler extends BaseErrorHandler {
    constructor (name, errorCode=errorCodes.INTERNAL_SERVER_ERROR, isOperational = true, description) {
        super(name, errorCode, isOperational, description)
    }
}

class Error502Handler extends BaseErrorHandler {
    constructor (name, errorCode=errorCodes.BAD_GATEWAY, isOperational = true, description) {
        super(name, errorCode, isOperational, description)
    }
}

module.exports = {
    Error400Handler,
    Error401Handler,
    Error403Handler,
    Error404Handler,
    Error405Handler,
    Error408Handler,
    Error410Handler,
    Error500Handler,
    Error502Handler
}

