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
   * But a suitable privileged admin-host could view all data.

The client applications `record-log` and `recent-events` should be
written in a portable fashion, such that they work with no other
applications present.

To avoid firewall complexity I would propose sending the data via
HTTP-POST requests.  Ideally SSL will be used to prevent sniffing.


Implementation
--------------

The implementation can be divided into three parts:

* A central server to receive submitted events.
   * And also retrieve recent entries.
* A client to submit an arbitrary record.
* A client to retrieve recent events from this host.


Installation
------------

Clone the repository.

     $ cd git
     $ git clone https://github.com/skx/sysadmin-logs
     $ cd sysadmin-logs

Initialize the submodule

     $ git submodule init
     $ git submodule update

Start the server:

     $ node server.js

Now you've done that you can submit data from any host like so:

     $ ./record-log "This is a test"

And view entries via:

     $ ./get-recent


Steve
--
