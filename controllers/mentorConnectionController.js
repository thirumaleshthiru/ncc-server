import { pool } from '../db/db.js';

const sendMentorConnection = async (req, res) => {
  const { mentorId, studentId } = req.body;

  if (!mentorId || !studentId) {
    return res.status(400).json({ message: 'Mentor ID and Student ID are required.' });
  }

  try {
    // Check if a connection already exists
    const checkQuery = `
      SELECT * 
      FROM mentor_student_connections 
      WHERE mentor_id = ? AND student_id = ?
    `;
    const [existingConnections] = await pool.query(checkQuery, [mentorId, studentId]);

    if (existingConnections.length > 0) {
      return res.status(200).json({ message: 'Connection request already exists.' });
    }

    // Insert the connection as a new pending request
    const query = `
      INSERT INTO mentor_student_connections (mentor_id, student_id, status)
      VALUES (?, ?, 'pending')
    `;
    await pool.query(query, [mentorId, studentId]);

    res.status(201).json({ message: 'Mentorship request sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending mentorship request.', error });
  }
};

const decideMentorConnection = async (req, res) => {
  const { connectionId, action } = req.body;

  if (!connectionId || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Valid connection ID and action are required.' });
  }

  try {
    // Check if the connection exists
    const checkQuery = `
      SELECT * 
      FROM mentor_student_connections 
      WHERE connection_id = ?
    `;
    const [rows] = await pool.query(checkQuery, [connectionId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mentorship request not found.' });
    }

    if (action === 'reject') {
      // Remove the connection if the action is reject
      const deleteQuery = `
        DELETE FROM mentor_student_connections
        WHERE connection_id = ?
      `;
      await pool.query(deleteQuery, [connectionId]);

      return res.status(200).json({ message: 'Mentorship request rejected successfully.' });
    }

    // Update the status if the action is accept
    const status = 'active';
    const updateQuery = `
      UPDATE mentor_student_connections
      SET status = ?
      WHERE connection_id = ?
    `;
    await pool.query(updateQuery, [status, connectionId]);

    res.status(200).json({ message: 'Mentorship request accepted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing mentorship request.', error });
  }
};

const getMentorConnections = async (req, res) => {
  const { mentorId } = req.params;

  if (!mentorId) {
    return res.status(400).json({ message: 'Mentor ID is required.' });
  }

  try {
    const query = `
      SELECT msc.connection_id, u.user_id, u.name, u.role, u.college, u.profile_pic
      FROM mentor_student_connections msc
      JOIN users u ON msc.student_id = u.user_id
      WHERE msc.mentor_id = ? AND msc.status = 'active'
    `;
    const [rows] = await pool.query(query, [mentorId]);

    res.status(200).json({ connections: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mentor connections.', error });
  }
};

const myMentorsByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const query = `
      SELECT msc.connection_id, u.user_id, u.name, u.role, u.college, u.profile_pic
      FROM mentor_student_connections msc
      JOIN mentors m ON msc.mentor_id = m.mentor_id
      JOIN users u ON m.user_id = u.user_id
      WHERE msc.student_id = ? AND msc.status = 'active'
    `;
    const [rows] = await pool.query(query, [userId]);

    res.status(200).json({ mentors: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mentors.', error });
  }
};
  
const getMyRequests = async (req, res) => {
  try {
    const mentorId = req.params.mentorId;

    const [requests] = await pool.query(
      'SELECT * FROM mentor_student_connections WHERE mentor_id = ? AND status = "pending"',
      [mentorId]
    );

    res.status(200).json(requests); // Direct access to results
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch pending requests',
      details: error.message
    });
  }
};

const getMentorsByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const query = `
      SELECT mentor_id, user_id
      FROM mentors
      WHERE user_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No mentor found for this user.' });
    }

    res.status(200).json({ mentor: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mentor.', error });
  }
};

export { getMyRequests, sendMentorConnection, decideMentorConnection, getMentorConnections, myMentorsByUserId, getMentorsByUserId };