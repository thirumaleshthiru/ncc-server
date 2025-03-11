import { connection } from '../db/db.js';

const sendConnection = async (req, res) => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: 'Sender and Receiver IDs are required.' });
  }

  try {
    // Check if a connection already exists
    const checkQuery = `
      SELECT * 
      FROM user_connections 
      WHERE (sender_id = ? AND receiver_id = ?) 
         OR (sender_id = ? AND receiver_id = ?)
    `;
    const [existingConnections] = await connection.promise().query(checkQuery, [senderId, receiverId, receiverId, senderId]);

    if (existingConnections.length > 0) {
      return res.status(200).json({ message: 'Connection request already exists.' });
    }

    // Insert the connection as a new pending request
    const query = `
      INSERT INTO user_connections (sender_id, receiver_id, status)
      VALUES (?, ?, 'pending')
    `;
    await connection.promise().query(query, [senderId, receiverId]);

    res.status(201).json({ message: 'Connection request sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending connection request.', error });
  }
};

const decideConnection = async (req, res) => {
  const { connectionId, action } = req.body;

  if (!connectionId || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Valid connection ID and action are required.' });
  }

  try {
    // Check if the connection exists
    const checkQuery = `
      SELECT * 
      FROM user_connections 
      WHERE connection_id = ?
    `;
    const [rows] = await connection.promise().query(checkQuery, [connectionId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Connection request not found.' });
    }

    if (action === 'reject') {
      // Remove the connection if the action is reject
      const deleteQuery = `
        DELETE FROM user_connections
        WHERE connection_id = ?
      `;
      await connection.promise().query(deleteQuery, [connectionId]);

      return res.status(200).json({ message: 'Connection rejected successfully.' });
    }

    // Update the status if the action is accept
    const status = 'connected';
    const updateQuery = `
      UPDATE user_connections
      SET status = ?
      WHERE connection_id = ?
    `;
    await connection.promise().query(updateQuery, [status, connectionId]);

    res.status(200).json({ message: 'Connection accepted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing connection request.', error });
  }
};

const removeConnection = async (req, res) => {
  const { connectionId } = req.params;

  if (!connectionId) {
    return res.status(400).json({ message: 'Connection ID is required.' });
  }

  try {
    const query = `
      DELETE FROM user_connections
      WHERE connection_id = ?
    `;
    await connection.promise().query(query, [connectionId]);

    res.status(200).json({ message: 'Connection removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing connection.', error });
  }
};

const getConnections = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const query = `
      SELECT uc.connection_id, u.user_id, u.name, u.role, u.college, u.profile_pic
      FROM user_connections uc
      JOIN users u 
      ON (uc.sender_id = ? AND uc.receiver_id = u.user_id) 
      OR (uc.receiver_id = ? AND uc.sender_id = u.user_id)
      WHERE (uc.sender_id = ? OR uc.receiver_id = ?)
      AND uc.status = 'connected'
    `;
    const [rows] = await connection.promise().query(query, [userId, userId, userId, userId]);

    res.status(200).json({ connections: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching connections.', error });
  }
};

const getRequests = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const query = `
      SELECT uc.connection_id, u.user_id, u.name, u.role, u.college, u.profile_pic
      FROM user_connections uc
      JOIN users u ON uc.sender_id = u.user_id
      WHERE uc.receiver_id = ?
      AND uc.status = 'pending'
    `;
    const [rows] = await connection.promise().query(query, [userId]);

    res.status(200).json({ pendingRequests: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching connection requests.', error });
  }
};

export { sendConnection, decideConnection, removeConnection, getConnections, getRequests };
