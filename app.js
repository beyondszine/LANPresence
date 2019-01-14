const Influx = require('influx');
const http = require('http');
const os = require('os');
const path = require('path');
const arpScanner = require('arpscan');
const winston = require('winston');
const config = require('config');
const ourConfigDir = path.join(__dirname, 'config');
console.log(ourConfigDir);

const baseConfig = config.util.loadFileConfigs(ourConfigDir);
console.log(baseConfig);

var macToName = require('./macMapping');
var dbConfig = baseConfig.Scan.dbConfig;
console.log("dbConfig:",dbConfig);


var logConfig = baseConfig.Scan.LogConfig;
console.log("logConfig:",logConfig);

var scannerConfig = baseConfig.Scan.ScannerConfig;
console.log("scannerConfig:",scannerConfig);  


function m_logConfig(){
  logger.info("dbConfig:",dbConfig);
  logger.info("logConfig:",logConfig);
  logger.info("scannerConfig:",scannerConfig);  
};


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
              ])
              .then(function(){
                logger.info('written successfully!');
              }).catch(err => {
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


  process.on('uncaughtException', (err) => {
    logger.error(`Exception occured! ${err}`);
  });
 
  process.on('exit', (code) => {
    logger.error(`About to exit with code: ${code}`);
  });

  // m_logConfig();
  arpScanner(onResult, scannerOptions);