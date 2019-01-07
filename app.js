const Influx = require('influx');
const http = require('http');
const os = require('os');
const arpScanner = require('arpscan');
const winston = require('winston');
var program = require('commander');
var config = require('config');

var macToName = require('./macMapping');

var dbConfig = config.get('Scan.dbConfig');
var logConfig = config.get('Scan.LogConfig');
var scannerConfig = config.get('Scan.ScannerConfig');

console.log(dbConfig);
console.log(logConfig);
console.log(scannerConfig);

const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: [
    // new winston.transports.Console({ level: 'debug' }),
    new winston.transports.File({
      filename: logConfig.logFile,
      level: logConfig.logLevel
    })
  ]
});

// Make all of them user interface variables & allow interfaces to be selected from drop down of available interfaces.
var scannerOptions={
    command :   scannerConfig.program,
    args    :   [scannerConfig.targetNetwork],
    interface : scannerConfig.networkInterface,
    sudo    :   false
};


const influx = new Influx.InfluxDB({
  host: dbConfig.host,
  database: dbConfig.dbName,
  schema: [
    {
      measurement: dbConfig.measurementName,
      fields: {
        alive: Influx.FieldType.BOOLEAN
      },
      tags: ['host','mac','ip', 'hostname', 'nickname' ]
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
            let resolveHostname = (function (){
              // console.log(arpresponse.mac);
              // console.log(macToName);
              for (per_mac in macToName){
                if(per_mac == arpresponse.mac){
                  console.log(macToName[per_mac]);
                  return macToName[per_mac];
                }
                // else{
                //   console.log("MAC association not found!");
                //   return "UNKNOWN NODE";
                // }
              }
              return arpresponse.mac;
            })();

            influx.writePoints([
                {
                  measurement: 'presenceIdentifier2',
                  tags: { 
                    host: os.hostname(), 
                    mac :  arpresponse.mac,
                    ip : arpresponse.ip,
                    nickname : resolveHostname,
                    hostname : "nextrelease"
                  },
                  fields: { alive : true },
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