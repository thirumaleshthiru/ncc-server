import { pool } from '../db/db.js';

const addSkill = async (req, res) => {
  const { userId, skillId } = req.body;
  let connection;

  if (!userId || !skillId) {
    return res.status(400).json({ message: 'User ID and Skill ID are required.' });
  }

  try {
    connection = await pool.getConnection();
    
    const query = `
      INSERT INTO user_skills (user_id, skill_id)
      VALUES (?, ?)
    `;
    await connection.query(query, [userId, skillId]);

    res.status(201).json({ message: 'Skill assigned to user successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning skill to user.', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const deleteSkill = async (req, res) => {
  const { userId, skillId } = req.params;
  let connection;

  if (!userId || !skillId) {
    return res.status(400).json({ message: 'User ID and Skill ID are required.' });
  }

  try {
    connection = await pool.getConnection();
    
    const query = `
      DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?
    `;
    await connection.query(query, [userId, skillId]);

    res.status(200).json({ message: 'Skill removed from user successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing skill from user.', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const getSkills = async (req, res) => {
  const { userId } = req.params;
  let connection;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT s.skill_id, s.skill_name
      FROM skills s
      JOIN user_skills us ON s.skill_id = us.skill_id
      WHERE us.user_id = ?
    `;
    const [skills] = await connection.query(query, [userId]);

    res.status(200).json({ skills });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching skills for user.', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export { addSkill, deleteSkill, getSkills };