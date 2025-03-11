import { pool } from '../db/db.js';

const addSkill = async (req, res) => {
  const { skillName } = req.body;

  if (!skillName) {
    return res.status(400).json({ message: 'Skill name is required.' });
  }

  try {
    const query = `
      INSERT INTO skills (skill_name)
      VALUES (?)
    `;
    await pool.query(query, [skillName]);

    res.status(201).json({ message: 'Skill added successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding skill.', error });
  }
};

const deleteSkill = async (req, res) => {
  const { skillId } = req.params;

  if (!skillId) {
    return res.status(400).json({ message: 'Skill ID is required.' });
  }

  try {
    const query = `
      DELETE FROM skills WHERE skill_id = ?
    `;
    await pool.query(query, [skillId]);

    res.status(200).json({ message: 'Skill deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting skill.', error });
  }
};

const getSkill = async (req, res) => {
  const { skillId } = req.params;

  if (!skillId) {
    return res.status(400).json({ message: 'Skill ID is required.' });
  }

  try {
    const query = `
      SELECT * FROM skills WHERE skill_id = ?
    `;
    const [rows] = await pool.query(query, [skillId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Skill not found.' });
    }

    res.status(200).json({ skill: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving skill.', error });
  }
};

const getAllSkills = async (req, res) => {
  try {
    const query = `
      SELECT * FROM skills
    `;
    const [skills] = await pool.query(query);

    res.status(200).json({ skills });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching skills.', error });
  }
};

export { addSkill, deleteSkill, getSkill, getAllSkills };