import express from 'express';
import Organization from '../models/Organization';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { organizationName, username, password } = req.body;
    
    const existingOrg = await Organization.findOne({ username });
    if (existingOrg) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newOrg = new Organization({
      organizationName,
      username,
      password,
    });

    await newOrg.save();
    res.status(201).json({ message: 'Organization registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const org = await Organization.findOne({ username });
    if (!org || org.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ 
      message: 'Login successful',
      organization: {
        id: org._id,
        organizationName: org.organizationName,
        username: org.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
