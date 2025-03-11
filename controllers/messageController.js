import { connection } from '../db/db.js';

// Send a message from one user to another
const sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  if (!senderId || !receiverId || !content) {
    return res.status(400).json({ message: 'Sender ID, Receiver ID, and message content are required.' });
  }

  try {
    const query = `
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `;
    await connection.promise().query(query, [senderId, receiverId, content]);

    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message.', error });
  }
};

// Retrieve a specific message by ID
const getMessage = async (req, res) => {
  const { messageId } = req.params;

  if (!messageId) {
    return res.status(400).json({ message: 'Message ID is required.' });
  }

  try {
    const query = `
      SELECT * FROM messages
      WHERE message_id = ?
    `;
    const [rows] = await connection.promise().query(query, [messageId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    res.status(200).json({ message: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving message.', error });
  }
};

// Delete a message by ID
const deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  if (!messageId) {
    return res.status(400).json({ message: 'Message ID is required.' });
  }

  try {
    const deleteQuery = `
      DELETE FROM messages
      WHERE message_id = ?
    `;
    const [result] = await connection.promise().query(deleteQuery, [messageId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    res.status(200).json({ message: 'Message deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message.', error });
  }
};

// Fetch all messages for a user ID (both sent and received)
const getMessagesByUser = async (req, res) => {
    const { userId } = req.params;
  
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
  
    try {
      const query = `
        SELECT * 
        FROM messages 
        WHERE sender_id = ? OR receiver_id = ?
        ORDER BY created_at DESC
      `;
      const [messages] = await connection.promise().query(query, [userId, userId]);
  
      res.status(200).json({ messages });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching messages.', error });
    }
  };

  const getMessagesBetweenUsers = async (req, res) => {
    const { userId, receiverId } = req.params;
  
    if (!userId || !receiverId) {
      return res.status(400).json({ message: 'User ID and Receiver ID are required.' });
    }
  
    try {
      const query = `
        SELECT * 
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC
      `;
      const [messages] = await connection.promise().query(query, [userId, receiverId, receiverId, userId]);
  
      if (messages.length === 0) {
        return res.status(404).json({ message: 'No messages found between these users.' });
      }
  
      res.status(200).json({ messages });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching messages.', error });
    }
  };
  
  

export { getMessagesBetweenUsers, sendMessage, getMessage, deleteMessage, getMessagesByUser };
