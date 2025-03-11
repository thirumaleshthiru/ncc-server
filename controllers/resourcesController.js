import { connection } from '../db/db.js';

const addResource = async (req, res) => {
  const { type, resource_name, resource_description, content, suggested_skill, mentor_id } = req.body;

  if (!type || !resource_name || !resource_description || !content || !mentor_id) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const query = `
      INSERT INTO resources (type, resource_name, resource_description, content, suggested_skill, mentor_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await connection.promise().query(query, [type, resource_name, resource_description, content, suggested_skill, mentor_id]);

    res.status(201).json({ message: 'Resource added successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding resource.', error });
  }
};

const updateResource = async (req, res) => {
  const { resource_id } = req.params;
  const { resource_name, resource_description, content, suggested_skill, type } = req.body;

  if (!resource_id) {
    return res.status(400).json({ message: 'Resource ID is required.' });
  }

  try {
    const query = `
      UPDATE resources 
      SET resource_name = ?, resource_description = ?, content = ?, suggested_skill = ?, type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE resource_id = ?
    `;
    const [result] = await connection.promise().query(query, [resource_name, resource_description, content, suggested_skill, type, resource_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    res.status(200).json({ message: 'Resource updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating resource.', error });
  }
};

const deleteResource = async (req, res) => {
  const { resource_id } = req.params;

  if (!resource_id) {
    return res.status(400).json({ message: 'Resource ID is required.' });
  }

  try {
    const query = `
      DELETE FROM resources WHERE resource_id = ?
    `;
    const [result] = await connection.promise().query(query, [resource_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    res.status(200).json({ message: 'Resource deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resource.', error });
  }
};

const getResourcesBySkill = async (req, res) => {
  const { skill_id } = req.params;

  if (!skill_id) {
    return res.status(400).json({ message: 'Skill ID is required.' });
  }

  try {
    const query = `
      SELECT * FROM resources WHERE suggested_skill = ?
    `;
    const [resources] = await connection.promise().query(query, [skill_id]);

    if (resources.length === 0) {
      return res.status(404).json({ message: 'No resources found for this skill.' });
    }

    res.status(200).json({ resources });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving resources for skill.', error });
  }
};

const getMyResources = async (req, res) => {
  const { mentor_id } = req.params;

  if (!mentor_id) {
    return res.status(400).json({ message: 'Mentor ID is required.' });
  }

  try {
    const query = `
      SELECT * FROM resources WHERE mentor_id = ?
    `;
    const [resources] = await connection.promise().query(query, [mentor_id]);

    if (resources.length === 0) {
      return res.status(404).json({ message: 'No resources found for this mentor.' });
    }

    res.status(200).json({ resources });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving resources for mentor.', error });
  }
};

const getResource = async (req, res) => {
  const { resource_id } = req.params;

  if (!resource_id) {
    return res.status(400).json({ message: 'Resource ID is required.' });
  }

  try {
    const query = `
      SELECT * FROM resources WHERE resource_id = ?
    `;
    const [resource] = await connection.promise().query(query, [resource_id]);

    if (resource.length === 0) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    res.status(200).json({ resource: resource[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving resource.', error });
  }
};

const getAllResources = async (req, res) => {
  try {
    const query = `
      SELECT * FROM resources
    `;
    const [resources] = await connection.promise().query(query);

    if (resources.length === 0) {
      return res.status(404).json({ message: 'No resources available.' });
    }

    res.status(200).json({ resources });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving resources.', error });
  }
};

export {
  addResource,
  updateResource,
  deleteResource,
  getResourcesBySkill,
  getMyResources,
  getResource,
  getAllResources
};
