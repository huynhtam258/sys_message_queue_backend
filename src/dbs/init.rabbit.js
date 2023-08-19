const amqp = require('amqplib');

const connectToRabbitMQ = async () => {
    try {
        const connection = await amqp.connect('amqp://guest:guest@localhost')
        if (!connection) throw new Error('Connection nt established')

        const channel = await connection.createChannel()

        return { channel, connection }
    } catch (error) {
        console.error(`Error connecting to RabbitMQ`, error)
        throw error
    }
}

const connectToRabbitMQForTest = async () => {
    try {
        const { channel, connection } = await connectToRabbitMQ()

        // Publish message to a queue
        const queue = 'test-queue'
        const message = 'Hello, shopDev'
        await channel.assertQueue(queue);
        await channel.sendToQueue(queue, Buffer.from(message))

        // close the connection
        await connection.close()
    } catch (error) {
        console.error(`Error connecting to RabbitMQ`, error);
    }
}

const consumerQueue = async (channel, queueName) => {
    try {
        await channel.assertQueue(queueName, { durable: true })
        console.log(`waiting for messages...`);
        channel.consume(queueName, msg => {
            console.log(`Received message: ${queueName}::`, msg.content.toString());
            // 1. find user following
            // 2. send message to user
            // 3. yes, ok ===>> success
            // 4. error. setup DLX...
        }, {
            noAck: true
        })
    } catch (error) {
        console.error('error publish message to RabbitMQ::', error)
        throw error
    }
}

module.exports = {
    connectToRabbitMQ,
    connectToRabbitMQForTest,
    consumerQueue
}