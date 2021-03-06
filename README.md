# Harvey Mudd Computer Science submission site #

Harvey Mudd College CS Submission Site.

## Current Incomplete/Missing Features ##
 * There is currently no permission system. Any account is given student,
   grader, and professor access to all courses.
 * The grade page does not have an inline editor to mark up students' code
   the way the current site permits.
 * There is no support for autograding, rerunning tests, etc.
 * File submission doesn't actually work properly right now. It saves a
   document to somewhere within the git repository, but there is no organized
   file system right now. Since we’re already using MongoDB, it might make
   sense to use GridFS or similar. 
 * Locking files while grading them is not implemented.
 * There is currently no information about Euros.  Although we keep track of the
   times assignments are due and the times that students submit, we don’t actually
   use Euros.
   
## Current Known Bugs/Problems ##
 * Deleting an assignment or a file could potentially cause major problems since
   student files only reference the array index of their assignment and template.
   Assignments and templates really need a UID of some kind, possibly by unnesting
   models and using populate instead.
 * Hitting the back button from the grade page sometimes causes node to crash.
   We haven't been able to figure out why or consistently reproduce this bug,
   but it has happened several times.
 * There is currently no safety check that an assignment hasn't changed when
   something (a file, a grade, etc) is submitted. So, if a prof edits an
   assignment while a grader is modifying a grade, bad and unexpected behavior
   could arise. 
 * Because models are nested rather than referenced & populated, we have to
   do a very inelegant lookup any time we need to access an assignment,
   template, or file where we loop through the whole array until we see one
   with a matching name.
 * Related to the above, we encountered very strange behavior when saving an
   object after modifying it (e.g. saving after grading one of a student's
   files). An ordinary .save() doesn't capture the change, so we had to create
   a copy of the array and then use .update($set: {'fieldname': newArray})
   instead. Again, splitting the models and using reference + populate would
   likely fix this.
 * We began factoring out frequently-used code into helper functions so that
   it would be easier to modify later (e.g. if models get split), but there
   is still a large body of duplicated code in the routes.
 * Angular currently has to manually parse URLs sometimes
   (see grader_controller.js for an example). There should be a way to pass
   variables to angular from node, but we never found a good way to do this.
 * Most things redirect to /home rather than /, because right now / is the
   login page regardless of whether the current user is logged in.
 * Rather than by default setting a user's email to placeholder@cs.hmc.edu,
   we should probably set it to an empty string.
 * Angular assumes dates/times are in GMT and attempts to localize them, even
   if they are already localized.
 * There is no validation when editing an assignment to see if the user entered
   in a valid date.  A possible improvement for this would be to create
   custom editable inputs to use with jEditable, such as the yes/no toggle for
   partners.

## Tests ##

 * A series of end-to-end tests are run using protractor with webdriver. The setup of webdriver is described here, but varies depending on the OS: https://github.com/angular/protractor/blob/master/docs/getting-started.md

 * There must be a running webdriver-manager at localhost port 4444, and the node server must be running at localhost port 3000. If these ports need to be changed for some reason, the configuration for the webdriver port can be changed at cs-submission-site/frontend/protractor/config.js, and the port for the server can be changed
at cs-submission-site/frontend/protractor/tests/e2e_spec.js.

 * The tests can be run by typing the following in a terminal at the project root folder:
protractor ./frontend/protractor/config.js --suite e2e

 * The tests log in to a test user, look at the student view, and make sure that certain course and assignment information can be found. It then goes to the professor view by URL, and checks if navigation to the grader view is possible.

 * The current tests include examples of navigation and interaction, and looking at the way they are written should make it clear how to add additional tests. 
