/**
 * server.js - node.js service.
 *
 */


var http      = require('http')
var qs        = require('querystring');
var fs        = require('fs');
var redis_lib = null;


//
//  This code is nasty because I want to allow the service to run without
// the user having to update the environmental variable NODE_PATH,
// and setting that in code doesn't work.
//
//  The intention is that the user can install the required dependencies
// either via:
//
//    1. `npm install redis`
//
//    2.  Using the git submodules.
//
//  Either solution should work equally well, although I personally prefer the
// latter solution.  (Easier to see the local code, and easier to deploy via
// rsync.)
//
if ( fs.existsSync("./submodules/node_redis/index.js" ) ) {
    console.log( "Loading redis from git submodule.");
    redis_lib =require("./submodules/node_redis/index.js" )
} else {
    console.log( "Loading redis from beneath ./node_modules/");
    console.log( "If this fails install all dependencies by running:\n\t$ npm install" );
    redis_lib =require('redis/index.js');
}


/**
 * Our redis-connection.
 */
var redis = redis_lib.createClient();


/*
 * Trivial server for receiving POST requests to store work-logs,
 * and later retrieve them in-order.
 */
var server = http.createServer(function (request, response) {

    /**
     * If we're receiving a GET to "/recent" then it is to view.
     */
    if ( request.url == "/recent" && request.method === 'GET' ) {

        //
        //  Get the peer.
        //
        var peer = request.connection.remoteAddress;

        //
        //  For each recent message.
        //
        redis.lrange("messages-" + peer, 0, -1, function(err, msg){
            if ( err )
            {
                response.writeHead(200, {'content-type': 'application/json'});
                response.end('{"result":"ERRO","error":"' + err + '"}');
                return;
            }

            //
            //  We don't want the client to have to parse.
            //
            response.writeHead(200, {'content-type': 'text/plain'});

            //
            //  So just output.
            //
            msg.forEach(function(j){
                var x = JSON.parse( j );
                response.write( x['peer'] + " " + x['date'] + "\n" + x['user'] + ":" + x['msg'] + "\n" );
            });
            response.end();

        });
    }
    else if ( request.url == "/" && request.method === 'POST' ) {
        var data = '';
        request.addListener('data', function(chunk) { data += chunk; });
        request.addListener('end', function() {

            //
            //  The data we're adding.
            //
            var src  = request.connection.remoteAddress;
            var body = qs.parse(data);
            var msg  = body['msg'];
            var user = body['user'] || "unknown";

            //
            //  The object we'll store in redis, as JSON.
            //
            var hash = { 'msg': msg,
                        'user': user,
                        'date': new Date(),
                        'peer': src };

            //
            //  Log in a rotating buffer for this host.
            //
            redis.rpush( "messages-" + src, JSON.stringify( hash ) );

            //
            //  Log in the global messages.
            //
            redis.rpush( "messages", JSON.stringify( hash ) );

            console.log( "DATA:" + JSON.stringify(hash) );
            response.writeHead(200, {'content-type': 'application/json'});
            response.end('{"result":"OK"}');
        });
    }
    else
    {
        //
        //  If we reach here we've hit an unrecognized end-point,
        // or a valid destination but the wrong HTTP-verb.
        //
        //  Happily HTTP 405 is a sane response-code to return.
        //
        response.writeHead(405, {'content-type': 'text/plain' });
        response.end( "We only accept POST requests, via HTTP.  Ignoring method " + request.method + " to " + request.url );
    }

});

//
// If the server receives an error exit cleanly.
//
// (We assume a production deployment would run under runit/daemontools/similar.)
//
server.on('error', function(e) {
    if ( e.errno == "EADDRINUSE" ) {
        console.log( "Error: The server-port is already in use.\nIs the server already running?" );
    }
    else {
        console.log( "ERROR" + e);
    }
    process.exit( 0 );
});


//
// Start the server listening on both all IPv4 & all IPv6 addresses.
//
server.listen(9977, '::');


//
// Every five minutes show we're alive.
//
function alive()
{
    var now = new Date();
    console.log("Server alive " + now );
}
setInterval(alive, ( 5 * 60) * 1000);

