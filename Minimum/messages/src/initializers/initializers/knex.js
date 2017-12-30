"use strict";

var MySQLService = require("../../services/MySQLService");
var winston = require("winston");

MySQLService.init(function (err, knex) {

    if(err){
        winston.error(err);
        return process.exit(1);
    }

    winston.log("debug", "MySQL successfully initialized");

    MySQLService.set_character_set();

    knex.schema.hasTable('messages').then(function(exists) {
        if (!exists) {
            return knex.schema.createTableIfNotExists("messages", function (table) {
                MySQLService.define_message_schema(table);
            }).catch(function (error) {
                    winston.error(error);
            });
        }
    });

    knex.schema.hasTable('contacts').then(function(exists) {
        if (!exists) {
            return knex.schema.createTableIfNotExists("contacts", function (table) {
                MySQLService.define_contacts_schema(table);
            }).catch(function (error) {
                winston.error(error);
            });
        }
    });

    knex.schema.hasTable('group_members').then(function(exists) {
        if (!exists) {
            return knex.schema.createTableIfNotExists("group_members", function (table) {
                MySQLService.define_group_members_schema(table);
            }).catch(function (error) {
                winston.error(error);
            });
        }
    });

    knex.schema.hasTable('groups').then(function(exists) {
        if (!exists) {
            return knex.schema.createTableIfNotExists("groups", function (table) {
                MySQLService.define_group_schema(table);
            }).catch(function (error) {
                winston.error(error);
            });
        }
    });

    knex.schema.hasTable('tokens').then(function(exists) {
        if (!exists) {
            return knex.schema.createTableIfNotExists("tokens", function (table) {
                MySQLService.define_token_schema(table);
            }).catch(function (error) {
                winston.error(error);
            });
        }
    });

    knex.schema.hasTable('watched').then(function(exists) {
        if (!exists) {
            return knex.schema.createTableIfNotExists("watched", function (table) {
                MySQLService.define_watched_schema(table);
            }).catch(function (error) {
                winston.error(error);
            });
        }
    });

    knex.schema.hasTable('muted_groups').then(function(exists) {
        if (!exists) {
            return knex.schema.createTableIfNotExists("muted_groups", function (table) {
                MySQLService.define_muted_groups_schema(table);
            }).catch(function (error) {
                winston.error(error);
            });
        }
    });

    knex.schema.hasTable('snooze').then(function(exists) {
        if (!exists) {
            return knex.schema.createTableIfNotExists("snooze", function (table) {
                MySQLService.define_snooze_schema(table);
            }).catch(function (error) {
                winston.error(error);
            });
        }
    });

    knex.schema.hasTable('stories').then(function(exists) {
        if (!exists) {
            return knex.schema.createTableIfNotExists("stories", function (table) {
                MySQLService.define_story_schema(table);
            }).catch(function (error) {
                winston.error(error);
            });
        }
    });
});