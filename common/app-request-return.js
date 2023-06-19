class AppRequestReturn {
    constructor(statusCode, message, data, total) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.total = total;
    }
}

module.exports = AppRequestReturn;
