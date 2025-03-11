import fs from 'fs';
import path from 'path';
import { pool } from '../db/db.js';

export const getProfileById = async (req, res) => {
  const { userId } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT name, bio, profile_pic, college, current_year, current_sem, is_past_student
      FROM users
      WHERE user_id = ?
    `;
    const [results] = await connection.query(query, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { name, bio, currentYear, currentSem, isPastStudent } = req.body;
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const fetchQuery = `SELECT profile_pic FROM users WHERE user_id = ?`;
    const [fetchResults] = await connection.query(fetchQuery, [userId]);
  
    if (fetchResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    const existingProfilePic = fetchResults[0].profile_pic;
  
    const updateQuery = `
      UPDATE users
      SET name = ?, bio = ?, profile_pic = ?, current_year = ?, current_sem = ?, is_past_student = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;
    
    const [updateResults] = await connection.query(
      updateQuery,
      [name, bio, existingProfilePic, currentYear, currentSem, isPastStudent, userId]
    );
  
    if (updateResults.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};  

export const deleteProfile = async (req, res) => {
  const { userId } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    
    const fetchQuery = `SELECT profile_pic FROM users WHERE user_id = ?`;
    const [fetchResults] = await connection.query(fetchQuery, [userId]);

    if (fetchResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingProfilePic = fetchResults[0].profile_pic;

    if (existingProfilePic) {
      const profilePath = path.join('uploads', existingProfilePic);
      if (fs.existsSync(profilePath)) {
        fs.unlinkSync(profilePath);
      }
    }

    const deleteQuery = `DELETE FROM users WHERE user_id = ?`;
    const [deleteResults] = await connection.query(deleteQuery, [userId]);

    if (deleteResults.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const getProfiles = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT 
        u.user_id, 
        u.name, 
        u.email,
        u.role,
        u.college, 
        u.bio, 
        u.profile_pic, 
        u.is_past_student, 
        u.current_year, 
        u.current_sem,
        CASE WHEN m.mentor_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_mentor
      FROM users u
      LEFT JOIN mentors m ON u.user_id = m.user_id
    `;

    const [results] = await connection.query(query);

    if (results.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};