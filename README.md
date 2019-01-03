# LANPresence

Description:
-   This program runs a ARP-scan of local LAN network.  It works only in one broadcast domain or any casual network configuration.
-   Firewalls, Virtual LANs, network with different broadcast domains can be a blocker.  
-   IP address with MAC addresses are stored in Influx DB as timeseries data.
    -   #Running Influx DB manually
    ```sh
    docker run -p 8086:8086 -v /tmp/infludbtemp:/var/lib/influxdb influxdb
    ```
-   This app is assumed to run periodcially after desired amount of time to gather the time-series data. Ex- 10 minutes.
    -   ### Adding as a cron job
        ```sh
        */5 * * * * /usr/bin/node /path/to/my/projct/app.js
        ```
-   Any visualization tool can be conneted to Influx DB database for the purpose of visuallization.
    Ex- Graphana


- Adding influx db as Datastore in Grafana
- Writing Cool queries to plot graphs
- Example Graphs
    -   Person count at any time.
    -   How much time did any two spend together in hours/day/week? Useful to know how much time you spent in pair-programming ?
    -   Automatic attendance of employees.
    -   Is your friend alive ? Identify using his MAC address
    -   





Srcs:
-   https://github.com/node-influx/node-influx
-   https://www.influxdata.com/blog/getting-started-with-node-influx/
-   https://hub.docker.com/_/influxdb/
-   https://github.com/initialstate/pi-sensor-free-presence-detector/wiki

