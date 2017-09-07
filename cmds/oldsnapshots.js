/* OldSnapshots commander component
 * To use add require('../cmds/oldsnapshots.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';

//This exposes the command for use by autocmd.
module.exports = OldSnapshots;


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
function OldSnapshots(program) {

	program
		.command('oldsnapshots <repository>')
		.version('0.0.0')
		.description('Gets a list of all ES snapshots older than an amount of time.  If the <repository> name is invalid an error will occur.')
		.option(
			'-n --num_days <numdays>', 
			'The number of days to get snapshots for. (default: 7)', 
			function(val, def) {

				var parsed = parseInt(val);

				if (isNaN(parsed)) {
					console.log("Number of Days must be a valid number!");
					process.exit(200);
				}

				return parsed;
			},
			7
		)
		.action(internals.commandAction);	
};

/**
 * The action for handling the OldSnapshots Command
 * @param  {[type]} repository The Repository to Query
 * @param  {[type]} cmd        The cmd object
 * @return {[type]}            Nothing?
 */
internals.commandAction = function(repository, cmd) {

	//Add Verbose Check
	if (cmd.parent.verbose) {
		console.log("Repository: " + repository);
		console.log("Number of Days: " + cmd.num_days);
		console.log("Protocol: " + cmd.parent.protocol);
		console.log("Server: " + cmd.parent.server); //Program Option
		console.log("Port: " + cmd.parent.port); //Program Option
		console.log(cmd.parent.protocol + '://' + cmd.parent.server + ':' + cmd.parent.port);
	}

	//So we should be good to go here.
	internals.getSnapshotsFromRepo(
		{
			repo: repository,
			num_days: cmd.num_days,
			protocol: cmd.parent.protocol,
			server: cmd.parent.server,
			port: cmd.parent.port
		}, function(err, results) {
			if (err) {
				process.stderr.write("Error occurred fetching snapshots. " + err);
				process.exit(5);
			} else {
				//Print out items
				for ( var i = 0; i < results.length; i++ ) {
					process.stdout.write(results[i] + '\n');
				}

				process.exit(0);
			}
		}
	);
}

/**
 * Gets snapshots from repository
 * @param  {[type]} opts            the options for the query
 * @param {Number} opts.num_days - The number of days to query
 * @param {String} opts.repo - A repository name
 * @param {String} opts.server - The ElasticSearch server IP or hostname
 * @param {Number} opts.port - The Elaticsearch server port 
 * @param  {[type]} resultsCallback callback function for handling results.
 * @return {[type]}                 [description]
 */
internals.getSnapshotsFromRepo = function(opts, resultsCallback) {

	//Check and see if we have a valid callback.
	if (!(resultsCallback && _.isFunction(resultsCallback))) {
		throw new Error("getSnapshotsFromRepo requires resultsCallback");
	}

	//Setup elastic search client.
	var client = new elasticsearch.Client({
		host: opts.protocol + '://' + opts.server + ':' + opts.port,
		log: 'error'
	});

	//Call elasticsearch and get snapshot
	client.snapshot.get(
		{
			repository: opts.repo,
			snapshot: '_all'
		},
		function(error, response) {

			//If there is an error then pass it on to the callback.
			if (error) {
				resultsCallback(error, false);
			}

			//Otherwise, select all the snapshots that are older than our number of days
			var items = 
				_.chain(response.snapshots)
				.filter(					
					function(snapshot) {
						return moment(snapshot.end_time_in_millis).isBefore(moment().subtract(opts.num_days, 'day'), 'day');					
					}
				)
				.map('snapshot')
				.value(); 

			//Return the results using the callback.
			resultsCallback(false, items)
		}
	)
}



