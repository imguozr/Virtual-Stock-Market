const db = require('../utils/db');
const User = require('./User')

var Payment = db.defineModel('user_payment', {
    payment_id: {
        type: db.ID_TYPE,
        primaryKey: true,
        defaultValue: db.UUIDV4
    },
    payment_nickname: db.STRING(50),
    account_number: db.STRING(10),
    routing_number: db.STRING(10)
});

Payment.belongsTo(User);

module.exports = Payment;
