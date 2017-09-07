/* IndexesForAlias commander component
 */
'use strict';

//This exposes the command for use by autocmd.
module.exports = IndexesForAlias;


// Load any required modules
var elasticsearch = require('elasticsearch');
var _ = require('lodash');

//Variable to hold internal items shared by all instances
var internals = {};


/**
 * Returns a list of indexes used by an alias
 * @param {[type]} program an instance of a commander program.
 */
function IndexesForAlias(program) {

	program
		.command('indexesforalias <aliasname>')
		.version('0.0.0')
		.description(' \
			Returns a list of indexes used by an alias.  Returns 0 if successful (even if there are no indexes), \
			returns -1 if the alias does not exist, and non-zero if errors occurred. \
		')
		.action(internals.commandAction);	
};

/**
 * The action for handling the command
 * @param  {[type]} aliasname The alias to Query
 * @param  {[type]} cmd        The cmd object
 * @return {[type]}            Nothing?
 */
internals.commandAction = function(aliasname, cmd) {

	//Add Verbose Check
	if (cmd.parent.verbose) {
		console.log("Alias Name: " + aliasname);
		console.log("Protocol: " + cmd.parent.protocol);
		console.log("Server: " + cmd.parent.server);
		console.log("Port: " + cmd.parent.port);
		console.log(cmd.parent.protocol + '://' + cmd.parent.server + ':' + cmd.parent.port);
	}

	//Setup elastic search client.
	var client = new elasticsearch.Client({
		host: cmd.parent.protocol + '://' + cmd.parent.server + ':' + cmd.parent.port,
		log: 'error'
	});


	client.indices.existsAlias(
		{
			name: aliasname
		},
		function(err, result) {
			if (err) {
				console.log(err);
				process.exit(5);
			}

			if (result) {
				//Since it exists, then we will do the work of getting the silly alias
				client.indices.getAlias(
					{
						alias: aliasname
					},
					function(getErr, getResult) {
						if (getErr) {
							console.log(getErr);
							process.exit(6);
						}


						var indices = internals.getIndicesFromResults(aliasname, getResult);

						for (var i = 0; i < indices.length; i++) {
							process.stdout.write(indices[i] + '\n');
						}

						process.exit(0);
					}
				);
			} else {
				if (cmd.parent.verbose) {
					process.stderr.write("Alias does not Exist");
				}
				process.exit(-1);
			}
		}
	);

}

/**
 * Extracts a list of indicies that are associated with an alias
 * @param  {[type]} aliasname The name of the alias we are looking for
 * @param  {[type]} res The results of the getAlias call
 * @return {[type]}     [description]
 */
internals.getIndicesFromResults = function(aliasname, res) {

	var indices = new Array();

	_.forEach(res, function(item, key) {
		if (_.has(item, ['aliases', aliasname])) {
			indices.push(key);
		}
	});

	return indices;
}


