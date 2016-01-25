/* OldSnapshots commander component
 * To use add require('../cmds/oldsnapshots.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';

//This exposes the command for use by autocmd.
module.exports = IsIndexAvailable;


// Load any required modules
var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var moment = require('moment');

//Variable to hold internal items shared by all instances
var internals = {};


/**
 * The old snapshots command
 * @param {[type]} program an instance of a commander program.
 */
function IsIndexAvailable(program) {

	program
		.command('isindexavailable <indexname>')
		.version('0.0.0')
		.description('Determines if an elasticsearch index exists or not.  Returns 0 if available, non-zero if not or error')
		.action(internals.commandAction);	
};

/**
 * The action for handling the OldSnapshots Command
 * @param  {[type]} repository The Repository to Query
 * @param  {[type]} cmd        The cmd object
 * @return {[type]}            Nothing?
 */
internals.commandAction = function(indexname, cmd) {

	//Add Verbose Check
	if (cmd.parent.verbose) {
		console.log("Index Name: " + indexname);
		console.log("Server: " + cmd.parent.server);
		console.log("Port: " + cmd.parent.port);
	}

	//Setup elastic search client.
	var client = new elasticsearch.Client({
		host: 'http://' + cmd.parent.server + ':' + cmd.parent.port,
		log: 'error'
	});


	client.indices.exists(
		{
			index: indexname
		},
		function(err, result) {
			if (err) {
				console.log(err);
				process.exit(5);
			}

			if (result) {
				//The index exists and it is unavailable.  Standard unix return in this case is non-0 value. (False)
				process.stdout.write('Unavailable');
				process.exit(1);
			}
			else {
				//The index does not exist and can be used.  Standard unix return in this case is 0 value. (True)
				process.stdout.write('Available');
				process.exit(0);
			}
		}
	);

}


