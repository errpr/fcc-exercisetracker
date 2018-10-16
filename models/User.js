const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let exerciseSchema = new Schema({
    description: { type: String, required: true },
    duration: { type: String, required: true },
    postDate: { type: Date, required: true }
});

let userSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    exercises: { type: [exerciseSchema] }, 
}, { usePushEach: true, collection: 'exercise_users' });

module.exports = mongoose.model("User", userSchema);