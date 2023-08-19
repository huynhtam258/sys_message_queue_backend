const { connectToRabbitMQ, consumerQueue } = require("../dbs/init.rabbit")

const messageService = {
    consumerToQueue: async (queueName) => {
        try {
            const { channel, connection } = await connectToRabbitMQ()
            await consumerQueue(channel, queueName)
        } catch (error) {
            console.error(`Error consumerToQueue::`,error)
        }
    }
}

module.exports = messageService