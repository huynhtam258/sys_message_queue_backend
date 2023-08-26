const { connectToRabbitMQ, consumerQueue } = require("../dbs/init.rabbit")

const messageService = {
    consumerToQueue: async (queueName) => {
        try {
            const { channel, connection } = await connectToRabbitMQ()
            await consumerQueue(channel, queueName)
        } catch (error) {
            console.error(`Error consumerToQueue::`,error)
        }
    },

    consumerToQueueNormal: async (queueName) => {
        try {
            const { channel, connection } = await connectToRabbitMQ()
            const notiQueue = 'notificationQueueProcess' // assertQueue

            // const timeExpried = 5000 // trường hợp thành công
            const timeExpried = 15000 // trường hợp test thất bại
            setTimeout(() => {
                channel.consume(notiQueue, msg => {
                    console.log(`SEND notificationQueue successfully processed::`, msg.content.toString());
                    channel.ack(msg)
                }) 
            }, timeExpried);

        } catch (error) {
            console.error(error)
        }
    },

    consumerToQueueFailed: async (queueName) => {
        try {
            const { channel, connection } = await connectToRabbitMQ()

            const notificationExchangeDLX = 'notificationExDLX' // notificationEx direct
            const notificationRoutingKeyDLX = 'notificationExDLX' //assert
            const notiQueueHandler = 'notificationQueueHotFix'

            await channel.assertExchange(notificationRoutingKeyDLX, 'direct', {
                durable: true
            })

            const queueResult = await channel.assertQueue(notiQueueHandler, {
                exclusive: false
            })
            await channel.bindQueue(queueResult.queue, notificationExchangeDLX, notificationRoutingKeyDLX)
            await channel.consume(queueResult.queue, msgFailed => {
                console.log(`this notification error, pls hotfix::`, msgFailed.content.toString());
            }, {
                noAck: true
            })
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

module.exports = messageService