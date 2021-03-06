var Course     = require('../models/course');
var Assignment = require('../models/assignment');
var FileTemplate = require('../models/fileTemplate');
var Student    = require('../models/student');
var Grader     = require('../models/grader');
var User       = require('../models/user');
var Professor  = require('../models/professor');

module.exports = function(app, passport){
    app.get("/prof", isLoggedIn, function(req, res) {
        res.render("prof");
    });

    app.get("/prof/course/:course", isLoggedIn, function(req, res) {
        res.render("prof");
    });

    app.get("/prof/course/:course/addStudent", isLoggedIn, function(req, res) {
        res.render("add_student");
    });

    app.post("/addstudents/course/:course", function(req, res) {
        var coursename = req.params.course;

        Course.findOne({
            "name": coursename
        }, function(err, course) {
            var studentsText = req.body.students;
            var shouldBeGrader = req.body.grader;

            // Parse on spaces, tabs, commas, newlines, semicolon
            var separated = studentsText.split(/[\s\t\n,;]+/);

            separated.forEach(function(username) {
                User.findOne({
                    "local.username": username
                }, function(err, user) {
                    // If the user didn't exist, we should create them
                    if (!user) {
                        user = new User();
                        user.local.username = username;
                        user.local.password = user.generateHash("asdf");
                        user.local.email = "placeholder@cs.hmc.edu";
                        user.save();
                    }

                    if (shouldBeGrader) {
                        // If they're already a grader in this course, don't
                        // create a new one.
                        Grader.findOne({
                            "user_id": user._id,
                            "course_id": course._id
                        }, function(err, grader) {
                            if (grader) {
                                return;
                            }

                            // Create a grader object, save it, and add it to
                            // the user's list of graders.
                            grader = new Grader();
                            grader.course_id = course._id;
                            grader.user_id = user._id;
                            grader.name = username;
                            grader.save();
                            user.graders.push(grader._id);
                            user.save();
                        });
                    } else {
                        // If they're already a student in this course,
                        // don't create a second one.
                        Student.findOne({
                            "user_id": user._id,
                            "course_id": course._id
                        }, function(err, student) {
                            if (student) {
                                return;
                            }

                            // Create the student object, save it, and add it
                            // to the user's list of students.
                            student = new Student();
                            student.course_id = course._id;
                            student.user_id = user._id;
                            student.name = username;
                            student.save();
                            user.students.push(student._id);
                            user.save();
                        });
                    }
                });
            });
        });
        res.redirect("/prof/course/"+coursename+"/addStudent");
    });


    app.post("/removestudents/course/:course", function(req, res) {
        var coursename = req.params.course;

        Course.findOne({
            "name": coursename
        }, function(err, course) {
            if(err) {
              console.log(err);
              return;
            }

            if(!course) {
              console.log("Failed to find course " + coursename + " by name");
              return;
            }
            var students = req.body.students;
            var graders = req.body.grader;

            students.forEach(function(student) {
                if (student.toRemove) {
                    User.findOne({
                        "local.username": student.name
                    }, function(err, user) {

                        // TODO: There really should be a nicer way to do this...
                        user.students.forEach(function(aStudent, index) {
                            if (student._id === aStudent) {
                                user.students.splice(index, 1);
                                // TODO: Make sure that this actually saves the
                                //       removal.
                                user.save();
                            }
                        });

                        Student.findOne({
                            "course_id": course._id,
                            "name": student.name
                        }, function(err, aStudent) {
                            aStudent.remove();
                        });
                    });
                }
            });

            graders.forEach(function(grader) {
                if (grader.toRemove) {
                    User.findOne({
                        "local.username": grader.name
                    }, function(err, user) {
                        user.students.forEach(function(aGrader, index) {
                          // TODO: There really should be a nicer way to do this...
                            if (grader._id === aGrader) {
                                user.graders.splice(index, 1);
                                // TODO: Make sure that this actually saves the
                                //       removal.
                            }
                        });

                        Grader.findOne({
                            "course_id": course._id,
                            "name": grader.name
                        }, function(err, aGrader) {
                            aGrader.remove();
                        });
                    });
                }
            });

        });
        res.redirect("/prof/course/"+coursename+"/addStudent");
    });

    app.post("/course/:course/addAssignment", function(req, res) {
        var coursename = req.params.course;
        var name = req.body.name;
        var due = req.body.due;
        var files = req.body.files;

        var totalPoints = 0;

        Course.findOne({
            "name": coursename
        }, function(err, course) {
            if(err) {
              console.log(err);
              return;
            }

            if(!course) {
              console.log("Failed to find course " + coursename + " by name");
              return;
            }
            var templates = [];

            // Create template files as specified.
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                fileTemplate = new FileTemplate();
                fileTemplate.name = f.name;
                fileTemplate.maxScore = Number(f.maxPoints);
                fileTemplate.partnerable = f.partnerable;

                totalPoints += Number(f.maxPoints);
                templates.push(fileTemplate);
            }

            // Create assignment, set fields, and save.
            assignment = new Assignment();
            assignment.name = name;
            assignment.due = new Date(due);
            assignment.point = Number(totalPoints);
            assignment.files = templates;

            course.assignments.push(assignment);
            course.save();
        });
        res.redirect("/prof/course/"+coursename);
    });

    app.post("/course/:course/deleteAssignment", function(req, res) {
        var coursename = req.params.course;
        var aName = req.body.name;

        Course.findOne({
            "name": coursename
        }, function(err, course) {
            // Remove the assignment from the course
            course.assignments.forEach(function(assignment, index) {
                if (assignment.name === aName) {
                    course.assignments.splice(index, 1);
                    course.save();
                }
            });
        });
        res.redirect("/prof/course/"+coursename);
    });

    app.post("/course/:course/saveAssignment", function(req, res) {
        var coursename = req.params.course;
        var id = req.body.id;
        var name = req.body.name;
        var due = req.body.due;
        var files = req.body.files;

        var totalPoints = 0;

        Course.findOne({
            "name": coursename
        }, function(err, course) {
            if(err) {
              console.log(err);
              return;
            }

            if(!course) {
              console.log("Failed to get course " + coursename + " by name");
              return;
            }

            var templates = [];
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                fileTemplate = new FileTemplate();
                fileTemplate.name = f.name;
                fileTemplate.maxScore = Number(f.maxPoints);
                fileTemplate.partnerable = f.partnerable;

                totalPoints += Number(f.maxPoints);
                templates.push(fileTemplate);
            }

            // TODO: As with helpers.js's updateStudent function, this is really
            //       hacky and there should be a better way to do it.
            var newAssignments = [];
            course.assignments.forEach(function(assignment) {
                if (assignment._id == id) {
                    assignment = new Assignment();
                    assignment.name = name;
                    assignment.due = new Date(due);
                    assignment.point = Number(totalPoints);
                    assignment.files = templates;
                }

                newAssignments.push(assignment);
            });

            course.assignments = newAssignments;
            course.save();
        });
        res.send("success");
    });

};


function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't, redirect them to the home page
    res.redirect('/');
}
