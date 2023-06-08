class AppRequestReturn {
    constructor(statusCode, message, data) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}

module.exports = AppRequestReturn;
