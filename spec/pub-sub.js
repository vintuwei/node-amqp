/*global module,require,global*/
(function testing() {
  'use strict';

  const code = require('code')
    , lab = require('lab').script()
    , describe = lab.describe
    , it = lab.it
    , before = lab.before
    , after = lab.after
    , expect = code.expect
    , testingConfigurations = require('./test.json')
    , nodeAmqp = require('..')
    , Publisher = nodeAmqp.Publisher
    , Subscriber = nodeAmqp.Subscriber
    , exchangedMessage = JSON.stringify({
      'message': 'hello'
    })
    , retryTimeoutMillisec = 20;

  class MySubscriber extends Subscriber {

    constructor() {
      super(testingConfigurations);
    }

    onMessage(message) {
      const messageArrived = message.content.toString();

      expect(messageArrived).to.be.equal(exchangedMessage);
      this.emit('test:finished');
    }
  }

  describe('node-amqp publisher talks to subscriber', () => {
    const publisher = new Publisher(testingConfigurations)
      , subscriber = new MySubscriber();
    let subFinished = false
      , pubFinished = false;

    subscriber.on('amqp:ready', () => {

      if (!subFinished) {

        subFinished = true;
      }
    });

    publisher.on('amqp:ready', () => {

      if (!pubFinished) {

        pubFinished = true;
      }
    });

    subscriber.on('amqp:connection-closed', () => {

      if (subFinished) {

        subFinished = false;
      }
    });

    publisher.on('amqp:connection-closed', () => {

      if (pubFinished) {

        pubFinished = false;
      }
    });

    before(done => {

      const onTimeoutTrigger = () => {

        if (pubFinished &&
          subFinished) {

          done();
        } else {

          global.setTimeout(onTimeoutTrigger, retryTimeoutMillisec);
        }
      };

      onTimeoutTrigger();
    });

    after(done => {

      const onTimeoutTrigger = () => {

        if (!pubFinished &&
          !subFinished) {

          done();
        } else {

          global.setTimeout(onTimeoutTrigger, retryTimeoutMillisec);
        }
      };

      onTimeoutTrigger();
      subscriber.closeConnection();
      publisher.closeConnection();
    });

    it('should publish a message and recieve', done => {

      subscriber.once('test:finished', () => {

        done();
      });
      publisher.send(exchangedMessage);
    });
  });

  module.exports = {
    lab
  };
}());
