// utils/groupConversations.js
const groupConversations = (messages) => {
  const groupedConversations = {};
  const responseWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Group messages by sender-receiver pairs
  messages.forEach((message) => {
    const key = [message.sender, message.receiver].sort().join('-'); // Sender-Receiver pair key
    if (!groupedConversations[key]) {
      groupedConversations[key] = [];
    }
    groupedConversations[key].push(message);
  });

  // Add response time check for each group
  Object.keys(groupedConversations).forEach((key) => {
    const messages = groupedConversations[key];

    // Sort messages by timestamp to maintain conversation order
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let firstMessage = messages[0]; // Get the first message in the conversation
    let hasResponse = false;

    // Check for a response within 24 hours
    for (let i = 1; i < messages.length; i++) {
      const currentMessageTime = new Date(firstMessage.timestamp).getTime();
      const nextMessageTime = new Date(messages[i].timestamp).getTime();
      const timeDifference = nextMessageTime - currentMessageTime;

      if (timeDifference <= responseWindow) {
        hasResponse = true; // Found a response within 24 hours
        break;
      }
    }

    groupedConversations[key] = { messages, hasResponse };
  });

  return groupedConversations;
};

module.exports = groupConversations;
