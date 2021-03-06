/*global global,require,module*/
(function withNode() {
  'use strict';

  const AmpqConnection = require('./connection')
    , amqpConfigurationSym = Symbol('amqpConfiguration')
    , channelSym = Symbol('channel');

  module.exports = function exportingFunction(amqp) {

    class AmpqTask extends AmpqConnection {

      constructor(amqpConfiguration) {

        super(amqp, amqpConfiguration);
        this[amqpConfigurationSym] = amqpConfiguration;
        this.on('amqp:channel-ready', channel => {

          this[channelSym] = channel;
          channel.assertQueue(amqpConfiguration.queueName, {
            'durable': true
          })
          .then(() => {

            this.emit('amqp:ready', channel);
          })
          .catch(err => {

            throw new Error(err);
          });
        });
      }

      send(data) {

        if (!data) {

          throw new Error('You must provide a valid payload to send');
        }
        const dataToSend = new global.Buffer(data)
          , queueParameters = {
            'deliveryMode': true
          };

        if (this[channelSym]) {

          this[channelSym].sendToQueue(this[amqpConfigurationSym].queueName, dataToSend, queueParameters);
        } else {

          this.on('amqp:ready', channel => {

            channel.sendToQueue(this[amqpConfigurationSym].queueName, dataToSend, queueParameters);
          });
        }
      }
    }

    return AmpqTask;
  };
}());
