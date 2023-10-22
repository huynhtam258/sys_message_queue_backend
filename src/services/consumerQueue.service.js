const { connectToRabbitMQ, consumerQueue } = require("../dbs/init.rabbit")

const log = console.log
console.log = function() {
    log.apply(console, [new Date()].concat(arguments))
}

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

            // 1. TTL
            // timeExpried: thời gian nhận tin nhắn
            // const timeExpried = 5000 // trường hợp thành công
            // const timeExpried = 15000 // trường hợp test thất bại
            // setTimeout(() => {
            //     channel.consume(notiQueue, msg => {
            //         console.log(`SEND notificationQueue successfully processed::`, msg.content.toString());
            //         channel.ack(msg)
            //     }) 
            // }, timeExpried);

            // 2. LOGIC
            channel.consume(notiQueue, msg => {
                try {
                    const numberTest = Math.random()
                    console.log({ numberTest})
                    if (numberTest < 0.8) {
                        throw new Error('Send notification failed: HOT FIX')
                    }

                    console.log('SEND notification Queue successfully processed:', msg.content.toString())
                    channel.ack(msg)
                } catch (error) {
                    // console.error('SEND notification error:', error);
                    channel.nack(msg, false, false)
                    // nack: khi dữ liệu bị lỗi, msg sẽ được ném vào queue lỗi
                    /*
                        nack: negative acknowledgement
                        params 1: tin nhắn
                        params 2: có nên sắp xếp lại tin nhắn hay không, nếu là true sẽ đẩy lại ví trí ban đầu, false thì đẩy tiếp vào hàng đợi bị lỗi
                        params 3: có muốn từ chối nhiều thư hay không
                    */
                }
            })

        } catch (error) {
            console.error(error)
        }
    },

    consumerToQueueFailed: async (queueName) => {
        try {
            const { channel, connection } = await connectToRabbitMQ()

            const notificationExchangeDLX = 'notificationExDLX' // notificationEx direct
            const notificationRoutingKeyDLX = 'notificationRoutingKeyDLX' //assert
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