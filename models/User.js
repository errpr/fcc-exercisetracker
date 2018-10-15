const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } }
});

module.exports = mongoose.model("User", userSchema);