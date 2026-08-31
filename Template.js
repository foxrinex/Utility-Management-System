/* Layer 1: Component Header & State Setup (Frontend)
At the top of your React component file, declare the state variables needed to track the input data and current item. */


import React, { useState } from 'react';

function OutageDashboard({ user, selectedIncident, setSelectedIncident }) {
  // 1. Declare state for form input
  const [reason, setReason] = useState('');
  
  // 2. Declare loading or error state (optional but good practice)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... event handlers go here ...
/* Layer 2: Form & Button Trigger (Frontend JSX)
Connect the state variable reason and updater function setReason directly to the <input /> element inside your JSX. */


  return (
    <div className="card">
      <h3>Escalate Incident #{selectedIncident?._id}</h3>

      {/* Form submit handler connected to form onSubmit */}
      <form onSubmit={handleEscalateReport}>
        
        {/* Controlled Input: value bound to `reason`, setter bound to `onChange` */}
        <input 
          type="text" 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          placeholder="Enter reason for escalation"
          required 
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Escalate Report'}
        </button>

      </form>
    </div>
  );
}

export default OutageDashboard;
/*
Layer 3: Event Handler Function (Frontend Logic)
Place this function directly inside your component above the return statement. It gathers state, issues the HTTP request, updates parent state, and clears local inputs.
*/

  const handleEscalateReport = (e) => {
    e.preventDefault(); // Stop default browser form refresh

    // Guard clause check
    if (!reason.trim() || !selectedIncident?._id) return;

    setIsSubmitting(true);

    const payload = {
      userId: user?.id || user?._id,
      reason: reason,
    };

    fetch(`http://localhost:5000/api/outages/escalate/${selectedIncident._id}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to submit escalation');
        return res.json();
      })
      .then((data) => {
        // Update parent state with updated object from backend
        setSelectedIncident(data.report);

        // RESET STATE at the top level
        setReason(''); 
      })
      .catch((err) => {
        console.error('Escalation error:', err);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  /*
Layer 4: Server Router (outageRoutes.js)
Mount the route path and assign it to the matching controller function.
*/

const express = require('express');
const router = express.Router();

// Import the specific controller function
const { escalateOutage } = require('../controllers/outageController');

// Definition: METHOD + PATH + CONTROLLER
// POST endpoint expecting a URL parameter :id
router.post('/api/outage/escalate/:id', escalateOutage);

module.exports = router;

/*
Layer 5: Backend Controller Function (outageController.js)
Receives request parameters and body data, interacts with the database model, and returns a JSON response with status codes.
*/

const Outage = require('../models/Outage');

const escalateOutage = async (req, res) => {
  try {
    // Extract dynamic URL parameter
    const outageId = req.params.id; 

    // Extract request body JSON fields
    const { userId, reason } = req.body; 

    // Input validation
    if (!userId || !reason) {
      return res.status(400).json({ error: 'User ID and reason are required' });
    }

    // Database operation (e.g., MongoDB / Mongoose)
    const updatedReport = await Outage.findByIdAndUpdate(
      outageId,
      { 
        $set: { 
          status: 'Escalated', 
          escalationReason: reason,
          escalatedBy: userId 
        } 
      },
      { new: true } // Return updated document to send back
    );

    if (!updatedReport) {
      return res.status(404).json({ error: 'Outage report not found' });
    }

    // Success response
    return res.status(200).json({
      message: 'Escalation success',
      report: updatedReport
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { escalateOutage };