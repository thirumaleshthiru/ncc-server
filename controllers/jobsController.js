import { pool } from '../db/db.js';
import axios from 'axios';

const fetchJobsForSkill = async (skill, location, jobType) => {
  try {
    const jobLocation = location || 'india';
     
    // Format the query for a single skill
    const query = `0 to 1 years fresher ${skill} jobs in india`;
    
    // Determine country code (default to 'in' for India)
    const countryCode = jobLocation.toLowerCase() === 'india' ? 'in' : 
                        (jobLocation.toLowerCase() === 'usa' || jobLocation.toLowerCase() === 'united states') ? 'us' : 'in';
    
    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: query,
        page: '1',
        num_pages: '1',
        country: countryCode,
        date_posted: 'all'
      },
      headers: {
        'x-rapidapi-key': 'd83aec77e6msh027e06524907233p17ab73jsn764cd4d9f43d',
        'x-rapidapi-host': 'jsearch.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    return {
      skill,
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching jobs for skill ${skill}:`, error);
    return {
      skill,
      data: { status: "ERROR", data: [] },
      error: error.message
    };
  }
};

// Fetch jobs for multiple skills in parallel
const fetchJobsFromAPI = async (searchTerm, skills, location, jobType) => {
  try {
    if (searchTerm) {
      // If there's a specific search term, just use that
      const result = await fetchJobsForSkill(searchTerm, location, jobType);
      return result.data;
    } else if (skills) {
      // For multiple skills, process as an array
      let skillsArray = Array.isArray(skills) ? skills : [skills];
      
      // If skillsArray is a string with multiple skills, split it
      if (skillsArray.length === 1 && typeof skillsArray[0] === 'string' && skillsArray[0].includes(',')) {
        skillsArray = skillsArray[0].split(',').map(s => s.trim());
      }
      
      // Make parallel requests for each skill
      const jobPromises = skillsArray.map(skill => 
        fetchJobsForSkill(skill, location, jobType)
      );
      
      const results = await Promise.all(jobPromises);
      
      // Combine all results and organize by skill
      const jobsBySkill = {};
      const allJobs = [];
      
      results.forEach(result => {
        if (result.data && result.data.data) {
          jobsBySkill[result.skill] = processJobData(result.data);
          
          // Add skill info to each job and add to combined array
          const jobsWithSkill = result.data.data.map(job => ({
            ...job,
            searched_skill: result.skill
          }));
          
          allJobs.push(...jobsWithSkill);
        }
      });
      
      return {
        status: "OK",
        data: allJobs,
        jobsBySkill: jobsBySkill
      };
    }
    
    return { status: "ERROR", data: [] };
  } catch (error) {
    console.error('Error in fetchJobsFromAPI:', error);
    throw error;
  }
};

const processJobData = (jobsData) => {
  if (!jobsData || !jobsData.data) return [];
  
  return jobsData.data.map(job => ({
    jobId: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    companyLogo: job.employer_logo,
    location: job.job_location,
    city: job.job_city,
    state: job.job_state,
    country: job.job_country,
    description: job.job_description,
    employmentType: job.job_employment_type,
    isRemote: job.job_is_remote,
    applyLink: job.job_apply_link,
    searchedSkill: job.searched_skill || '',
    salary: job.job_salary || {
      min: job.job_min_salary,
      max: job.job_max_salary,
      period: job.job_salary_period
    },
    postedAt: job.job_posted_at,
    googleLink: job.job_google_link,
    highlights: job.job_highlights || {}
  }));
};

const getJobsById = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const query = `
      SELECT skills.skill_name 
      FROM user_skills 
      JOIN skills ON user_skills.skill_id = skills.skill_id 
      WHERE user_skills.user_id = ?;
    `;
    const [skills] = await pool.query(query, [userId]);

    if (!skills.length) {
      return res.status(404).json({ message: 'No skills found for this user.' });
    }

    // Extract skill names as an array
    const skillNames = skills.map((skill) => skill.skill_name);
    const jobsResponse = await fetchJobsFromAPI(null, skillNames);
    
    res.status(200).json({ 
      jobs: processJobData(jobsResponse),
      jobsBySkill: jobsResponse.jobsBySkill || {},
      totalCount: jobsResponse.data ? jobsResponse.data.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs by user ID.', error: error.message });
  }
};

const getJobsBasedOnQuery = async (req, res) => {
  const { searchTerm, location, jobType } = req.body;

  if (!searchTerm) {
    return res.status(400).json({ message: 'Search term is required.' });
  }

  try {
    const jobsResponse = await fetchJobsFromAPI(searchTerm, null, location, jobType);
    const processedJobs = processJobData(jobsResponse);

    res.status(200).json({ 
      jobs: processedJobs,
      totalCount: jobsResponse.data ? jobsResponse.data.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs based on query.', error: error.message });
  }
};

const getJobsBasedOnSkill = async (req, res) => {
  const { skillName } = req.params;

  if (!skillName) {
    return res.status(400).json({ message: 'Skill name is required.' });
  }

  try {
    // Support comma-separated list of skills
    const skills = skillName.includes(',') ? 
      skillName.split(',').map(s => s.trim()) : 
      skillName;
      
    const jobsResponse = await fetchJobsFromAPI(null, skills);
    
    res.status(200).json({ 
      jobs: processJobData(jobsResponse),
      jobsBySkill: jobsResponse.jobsBySkill || {},
      totalCount: jobsResponse.data ? jobsResponse.data.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs based on skill.', error: error.message });
  }
};

export { getJobsById, getJobsBasedOnQuery, getJobsBasedOnSkill };