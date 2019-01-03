const Influx = require('influx');
const http = require('http');
const os = require('os');
const arpScanner = require('arpscan');


var options={
    command :   'arp-scan',
    args    :   ['-l'],
    interface : 'wlp2s0',
    sudo    :   true
};

const influx = new Influx.InfluxDB({
  host: 'localhost',
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
})

function onResult(err, data){
    if(err){
        throw err;
    }
    else{
        data.forEach(function(arpresponse){
            console.log(arpresponse.ip,arpresponse.mac);
            influx.writePoints([
                {
                  measurement: 'presenceIdentifier',
                  tags: { host: os.hostname() },
                  fields: { macaddress : arpresponse.mac, IPaddress: arpresponse.ip},
                }
              ]).catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`);
              });
        });
    } 
};


influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('Presence')) {
      return influx.createDatabase('Presence')
    }
  })
  .then(() => {
    arpScanner(onResult, options);
  })
  .catch(err => {
    console.error(`Error creating Influx database!`)
  })