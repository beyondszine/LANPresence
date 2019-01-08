const Influx = require('influx');
const http = require('http');
const os = require('os');
const arpScanner = require('arpscan');
const winston = require('winston');
// var program = require('commander');
var config = require('config');

var macToName = require('./macMapping');

var dbConfig = config.get('Scan.dbConfig');
var logConfig = config.get('Scan.LogConfig');
var scannerConfig = config.get('Scan.ScannerConfig');

const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: [
    // new winston.transports.Console({ level: 'debug' }),
    new winston.transports.File({
      filename: logConfig.logFile,
      level: 'debug'
    })
  ]
});

// Make all of them user interface variables & allow interfaces to be selected from drop down of available interfaces.
var scannerOptions={
    command :   scannerConfig.program,
    args    :   [scannerConfig.targetNetwork],
    interface : scannerConfig.nwInterface,
    sudo    :   true
};


const influx = new Influx.InfluxDB({
  username : dbConfig.username,
  // host : 'db.vedalabs.in:8086',
  host : dbConfig.host,
  port : dbConfig.port,
  password : dbConfig.password,
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
        logger.error("Error occured",err.message);
        throw err;
    }
    else{
        // logger.log("Printing all data\n\n",data);
        data.forEach(function(arpresponse){
            console.log(new Date()+"  IP addresses:  "+arpresponse.ip +"  MAC addresses:  "+arpresponse.mac);
            let resolveHostname = (function (){
              for (per_mac in macToName){
                if(per_mac == arpresponse.mac){
                  logger.info(macToName[per_mac]);
                  return macToName[per_mac];
                }
              }
              return arpresponse.mac;
            })();
            influx.writePoints([
                {
                  measurement: dbConfig.measurementName,
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
                logger.error(`Error saving data to InfluxDB!`);
              });
        });
    } 
};


influx.getDatabaseNames()
  .then(names => {
    logger.info(names);
    if (!names.includes(dbConfig.dbName)) {
      logger.info("Database doesn't exist already!!");
      return influx.createDatabase(dbConfig.dbName);
    }
  })
  .catch(err => {
    logger.error(`Error creating Influx database!`,err);
  });

  logger.info(scannerOptions);
  logger.info(dbConfig);
  arpScanner(onResult, scannerOptions);