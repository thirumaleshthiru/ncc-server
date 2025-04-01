import { pool } from '../db/db.js';

const sendConnection = async (req, res) => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: 'Sender and Receiver IDs are required.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if a connection already exists
    const [existingConnections] = await connection.query(`
      SELECT * 
      FROM user_connections 
      WHERE (user_id_1 = ? AND user_id_2 = ?) 
         OR (user_id_1 = ? AND user_id_2 = ?)
    `, [senderId, receiverId, receiverId, senderId]);

    if (existingConnections.length > 0) {
      connection.release();
      return res.status(200).json({ message: 'Connection request already exists.' });
    }

    // Insert the connection as a new pending request
    await connection.query(`
      INSERT INTO user_connections (user_id_1, user_id_2, status)
      VALUES (?, ?, 'pending')
    `, [senderId, receiverId]);

    connection.release();
    res.status(201).json({ message: 'Connection request sent successfully.' });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ message: 'Error sending connection request.', error: error.message });
  }
};

const decideConnection = async (req, res) => {
  const { connectionId, action } = req.body;

  if (!connectionId || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Valid connection ID and action are required.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if the connection exists
    const [rows] = await connection.query(`
      SELECT * 
      FROM user_connections 
      WHERE connection_id = ?
    `, [connectionId]);

    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Connection request not found.' });
    }

    if (action === 'reject') {
      // Remove the connection if the action is reject
      await connection.query(`
        DELETE FROM user_connections
        WHERE connection_id = ?
      `, [connectionId]);

      connection.release();
      return res.status(200).json({ message: 'Connection rejected successfully.' });
    }

    // Update the status if the action is accept
    const status = 'connected';
    await connection.query(`
      UPDATE user_connections
      SET status = ?
      WHERE connection_id = ?
    `, [status, connectionId]);

    connection.release();
    res.status(200).json({ message: 'Connection accepted successfully.' });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ message: 'Error processing connection request.', error: error.message });
  }
};

const removeConnection = async (req, res) => {
  const { connectionId } = req.params;

  if (!connectionId) {
    return res.status(400).json({ message: 'Connection ID is required.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    await connection.query(`
      DELETE FROM user_connections
      WHERE connection_id = ?
    `, [connectionId]);

    connection.release();
    res.status(200).json({ message: 'Connection removed successfully.' });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ message: 'Error removing connection.', error: error.message });
  }
};

const getConnections = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Fixed query with correct column names
    const [rows] = await connection.query(`
      SELECT uc.connection_id, u.user_id, u.name, u.role, u.college, u.profile_pic
      FROM user_connections AS uc
      JOIN users AS u 
      ON (uc.user_id_1 = ? AND uc.user_id_2 = u.user_id) 
      OR (uc.user_id_2 = ? AND uc.user_id_1 = u.user_id)
      WHERE (uc.user_id_1 = ? OR uc.user_id_2 = ?)
      AND uc.status = 'connected'
    `, [userId, userId, userId, userId]);

    connection.release();
    res.status(200).json({ connections: rows });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ message: 'Error fetching connections.', error: error.message });
  }
};

const getRequests = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Fixed query with correct column names
    const [rows] = await connection.query(`
      SELECT uc.connection_id, u.user_id, u.name, u.role, u.college, u.profile_pic
      FROM user_connections AS uc
      JOIN users AS u ON uc.user_id_1 = u.user_id
      WHERE uc.user_id_2 = ?
      AND uc.status = 'pending'
    `, [userId]);

    connection.release();
    res.status(200).json({ pendingRequests: rows });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ message: 'Error fetching connection requests.', error: error.message });
  }
};

export { sendConnection, decideConnection, removeConnection, getConnections, getRequests };