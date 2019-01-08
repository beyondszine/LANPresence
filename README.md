# LANPresence

**Screenshots**
![Presence demo screenshots ](/PresenceDemo.png "LANPresence Demo")

**Dependencies**

-   Debian/ubuntu based systems

        sudo apt-get install arpscan
        # OR
        chmod +x dependency.sh
        sudo ./dependency.sh
    
**Example Run**
```sh
DB_HOST="mydb.example.com" DB_PORT=8086 DB_NAME="mydbname" MEASUREMENT_NAME="mymeasurement" DB_USERNAME="user" DB_PASSWORD="supersecretpassword" LOG_LEVEL="debug" node app.js
```

**Description**
-   This program runs a ARP-scan of local LAN network.  It works only in one broadcast domain or any casual network configuration.
-   Firewalls, Virtual LANs, network with different broadcast domains can be a blocker.  
-   IP address with MAC addresses are stored in Influx DB as timeseries data.
    - **Running Influx DB manually via Docker**
    ```sh
    docker run -p 8086:8086 -v /tmp/infludbtemp:/var/lib/influxdb influxdb
    ```
-   This app is assumed to run periodcially after desired amount of time to gather the time-series data. Ex: 10 minutes.
    - **Manually Adding as a cron job**
    ```sh
    sudo crontab -e
    # Now append this entry at the end of file.
    */5 * * * * /usr/bin/node /path/to/my/projct/app.js
    ```
    
    - **One liner Addition as a cron job**
    ```sh
    (crontab -l 2>/dev/null; echo "*/5 * * * * /path/to/job -with args") | crontab -
    ```
    thanks to *Stackoverflow* [user](https://stackoverflow.com/users/45978/joe-casadonte) for this.
    Source : [StackerOverflow link](https://stackoverflow.com/questions/4880290/how-do-i-create-a-crontab-through-a-script)

-   Any visualization tool like Grafana can be conneted to Influx DB database for the purpose of visuallization.
    Steps for Grafana
    -   Run grafana with docker
    ```sh
    docker run -d --name=grafana -p 3000:3000 grafana/grafana
    ```
    -   Click on '+' sign on left pane of Grafana.
    -   Click on 'import'.
    -   Upload the file in current repository by the name of [Presence_json.txt](Presence_json.txt)

    

- Adding influx db as Datastore in Grafana
- Writing Cool queries to plot graphs
- Example Graphs
    -   Person count at any time.
    -   How much time did any two spend together in hours/day/week? Useful to know how much time you spent in pair-programming ?
    -   Automatic attendance of employees.
    -   Is your friend alive ? Identify using his MAC address



Srcs:
-   https://github.com/node-influx/node-influx
-   https://www.influxdata.com/blog/getting-started-with-node-influx/
-   https://hub.docker.com/_/influxdb/
-   https://github.com/initialstate/pi-sensor-free-presence-detector/wiki

