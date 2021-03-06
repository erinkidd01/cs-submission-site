// app/models/assignment.js
var mongoose = require('mongoose');
var fileTemplate = require('./fileTemplate');
// define the schema for our assignment model
// ObjectId allows us to reference other objects

var ObjectId = mongoose.Schema.Types.ObjectId;
//var ObjIdTy = mongoose.Types.ObjectId;
var assignmentSchema = mongoose.Schema({
//    course_id: ObjectId,
    name: String,
    due: Date,
    // TODO: add these types
    // type: ObjectId,
    euros: Number,
    point: Number,
    files: [ fileTemplate.fileTemplateSchema ]
});
// create the model expose it to our app
module.exports = mongoose.model('Assignment', assignmentSchema);
