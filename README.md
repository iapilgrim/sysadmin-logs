Work-Logs for multiple hosts
----------------------------

This is a proof of concept implementation of an idea a colleague
recently suggested.

In brief the idea is that if you're a sysadmin and you maintain
multiple systems you could run something like this:

    $ record-log "I fixed something."

    $ record-log "I tweaked my.cnf. "

Then later:

    $ recent-events
    27/09/2013 - 10:00 I tweaked my.cnf.
    27/09/2013 - 10:01 I fixed something.


Assumptions
-----------

* The recorded data must be sent off-host.
* The recorded data should only be visible to the host that submitted it
   * Because it is easy to imagine some hosts might have different local users, and they shouldn't be able to spy on the work you're doing on hosts they don't control.
   * But a suitable privileged admin-host could view all data.

The client applications `record-log` and `recent-events` should be
written in a portable fashion, such that they work with no other
applications present.  In this proof of concept hack we use `curl`.

To avoid firewall complexity I would propose sending the data via
HTTP-POST requests.

In the future SSL will be used to prevent sniffing.


Implementation
--------------

The implementation can be divided into three parts:

* A central server to receive submitted events.
   * And also allow a host to retrieve entries it has made in the past.
* A client to submit an arbitrary new "work-log" record.
* A client to retrieve recent events from this host.


Installation
------------

Providing you have a redis-server running on localhost and a working node.js installation then you can get started quickly.

Clone the repository:

     $ git clone https://github.com/skx/sysadmin-logs

Initialize the submodule:

     $ cd sysadmin-logs
     $ git submodule init
     $ git submodule update

Start the server:

     $ node server.js

Now you've done that you can submit data from any host like so:

     $ ./record-log "This is a test"

And view entries via:

     $ ./get-recent



Server Configuration
--------------------

The two scripts `get-recent` and `record-log` will default to using the server on localhost.  This is unlikely to be useful in production.

To specify a remote host to use please run:

      # echo server=logs.example.com  > /etc/sysadmin-logs.conf


**NOTE**: The port is hard-wired as 9977 currently.


Steve
--
