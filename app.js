const Influx = require('influx');
const http = require('http');
const os = require('os');
const arpScanner = require('arpscan');
const winston = require('winston');
const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: [
    // new winston.transports.Console({ level: 'debug' }),
    new winston.transports.File({
      filename: '/home/beyond/github/LANPresence/presence.log',
      level: 'debug'
    })
  ]
});


// Make all of them user interface variables & allow interfaces to be selected from drop down of available interfaces.

var options={
    command :   '/usr/sbin/arp-scan',
    args    :   ['192.168.1.1/24'],
    interface : 'wlp2s0',
    sudo    :   false
};

const influx = new Influx.InfluxDB({
  // host: '192.168.1.113:8086',
  host: 'localhost:8086',
  database: 'Presence',
  schema: [
    {
      measurement: 'presenceIdentifier',
      fields: {
        macaddress: Influx.FieldType.STRING,
        IPaddress: Influx.FieldType.STRING
      },
      tags: [
        'host'
      ]
    }
  ]
});

function onResult(err, data){
    if(err){
        logger.error("Error occured",err);
        throw err;
    }
    else{
        // console.log("Printing all data\n\n",data);
        data.forEach(function(arpresponse){
            logger.info(new Date()+"  IP addresses:  "+arpresponse.ip +"MAC addresses:  "+arpresponse.mac);
            influx.writePoints([
                {
                  measurement: 'presenceIdentifier',
                  tags: { host: os.hostname() },
                  fields: { macaddress : arpresponse.mac, IPaddress: arpresponse.ip},
                }
              ]).catch(err => {
                logger.error(`Error saving data to InfluxDB! ${err.stack}`);
              });
        });
    } 
};


influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('Presence')) {
      return influx.createDatabase('Presence');
    }
  })
  .then(() => {
    // let interfacesObject=os.networkInterfaces();
    // let totalInterfaces = Object.keys(interfacesObject);
    // if(totalInterfaces.length==1){
    //   options.interface = totalInterfaces[0];
    //   options.args = function(){
    //     interfacesObject[totalInterfaces[0]].forEach(function(version){
    //       if(version.family=='IPv4'){
    //         return version.cidr;
    //       }
    //     });
    //   };
    arpScanner(onResult, options);
    // }
  })
  .catch(err => {
    logger.error(`Error creating Influx database!`,err)
  });