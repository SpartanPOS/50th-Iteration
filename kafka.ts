import { Kafka } from 'kafkajs';

// 1. Initialize Kafka
const kafka = new Kafka({
  clientId: 'my-admin-app',
  brokers: ['localhost:9092'] // Replace with your broker list
});

// 2. Create the Admin client
const admin = kafka.admin();

async function createKafkaTopic() {
  try {
    // 3. Connect the Admin client
    await admin.connect();
    console.log('Admin connected...');

    // 4. Create the topic(s)
    const topicCreated = await admin.createTopics({
      topics: [
        // {
        //   topic: 'items',
        //   numPartitions: 1,     // Optional: Number of partitions
        //   replicationFactor: 1, // Optional: Number of replicas
        // },
        // {
        //     topic: 'tx',
        //     numPartitions: 1,
        //     replicationFactor: 1,
        // },
        // {
        //     topic: 'config',
        //     numPartitions: 1,
        //     replicationFactor: 1,
        // },
        // {
        //     topic: 'status',
        //     numPartitions: 1,
        //     replicationFactor: 1,
        // },
        // {
        //     topic: 'menu',
        //     numPartitions: 1,
        //     replicationFactor: 1,
        // }
      ],
      // waitForLeaders: true, // Optional: Wait for partition leaders to be assigned (defaults to true)
    });

    if (topicCreated) {
      console.log('Topic created successfully!');
    } else {
      console.log('Topic already exists.');
    }

  } catch (error) {
    console.error('Error creating topic:', error);
  } finally {
    // 5. Always disconnect when done
    await admin.disconnect();
    console.log('Admin disconnected.');
  }
}

createKafkaTopic();