const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  courseName: String,
  courseDescription: String
}, {
  timestamps: true
});

const Course = mongoose.model("Course", userSchema);
module.exports = Course;
