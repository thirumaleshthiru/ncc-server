import { connection } from '../db/db.js';

 

const addStory = async (req, res) => {
  const { story_name, story_description, content, author, suggested_skill } = req.body;
  const thumbnail = req.file ? req.file.filename : 'placeholder-image.webp';

  if (!story_name || !story_description || !content || !author || !suggested_skill) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const query = `
      INSERT INTO stories (story_name, story_description, content, author, suggested_skill, thumbnail)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await connection.promise().query(query, [story_name, story_description, content, author, suggested_skill, thumbnail]);

    res.status(201).json({ message: 'Story added successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding story.', error });
  }
};

const updateStory = async (req, res) => {
  const { story_id } = req.params;
  const { story_name, story_description, content, suggested_skill } = req.body;
  const thumbnail = req.file ? req.file.filename : 'placeholder-image.webp';

  if (!story_id) {
    return res.status(400).json({ message: 'Story ID is required.' });
  }

  try {
    const query = `
      UPDATE stories
      SET story_name = ?, story_description = ?, content = ?, suggested_skill = ?, thumbnail = ?, updated_at = CURRENT_TIMESTAMP
      WHERE story_id = ?
    `;
    const [result] = await connection.promise().query(query, [story_name, story_description, content, suggested_skill, thumbnail, story_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    res.status(200).json({ message: 'Story updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating story.', error });
  }
};

 
const getStory = async (req, res) => {
  const { story_id } = req.params;

  if (!story_id) {
    return res.status(400).json({ message: 'Story ID is required.' });
  }

  try {
    const query = `
      SELECT s.*, u.name AS author_name, sk.skill_name AS suggested_skill_name
      FROM stories s
      LEFT JOIN users u ON s.author = u.user_id
      LEFT JOIN skills sk ON s.suggested_skill = sk.skill_id
      WHERE s.story_id = ?
    `;
    const [story] = await connection.promise().query(query, [story_id]);

    if (story.length === 0) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    res.status(200).json({ story: story[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving story.', error });
  }
};


const getStoriesByUser = async (req, res) => {
  const { author_id } = req.params;

  if (!author_id) {
    return res.status(400).json({ message: 'Author ID is required.' });
  }

  try {
    const query = `
      SELECT 
          s.story_id, 
          s.story_name, 
          s.story_description, 
          s.content, 
          s.thumbnail, 
          s.created_at, 
          s.updated_at, 
          u.name AS author_name, 
          sk.skill_name AS suggested_skill_name
      FROM 
          stories s
      JOIN 
          users u ON s.author = u.user_id
      LEFT JOIN 
          skills sk ON s.suggested_skill = sk.skill_id
      WHERE 
          s.author = ?;
    `;
    const [stories] = await connection.promise().query(query, [author_id]);

    if (stories.length === 0) {
      return res.status(404).json({ message: 'No stories found for this author.' });
    }

    res.status(200).json({ stories });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving stories.', error });
  }
};


const getAllStories = async (req, res) => {
  try {
    const query = `
      SELECT 
          s.story_id, 
          s.story_name, 
          s.story_description, 
          s.content, 
          s.thumbnail, 
          s.created_at, 
          s.updated_at, 
          u.name AS author_name, 
          sk.skill_name AS suggested_skill_name
      FROM 
          stories s
      JOIN 
          users u ON s.author = u.user_id
      LEFT JOIN 
          skills sk ON s.suggested_skill = sk.skill_id;
    `;
    const [stories] = await connection.promise().query(query);

    if (stories.length === 0) {
      return res.status(404).json({ message: 'No stories found.' });
    }

    res.status(200).json({ stories });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving all stories.', error });
  }
};


// Delete Story
const deleteStory = async (req, res) => {
  const { story_id } = req.params;

  if (!story_id) {
    return res.status(400).json({ message: 'Story ID is required.' });
  }

  try {
    const query = `
      DELETE FROM stories WHERE story_id = ?
    `;
    const [result] = await connection.promise().query(query, [story_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Story not found.' });
    }

    res.status(200).json({ message: 'Story deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting story.', error });
  }
};

export {
  addStory,
  updateStory,
  getStory,
  getStoriesByUser,
  getAllStories,
  deleteStory
};
