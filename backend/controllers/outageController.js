const Outage = require('../models/outage');

// --- FETCH ALL ACTIVE DISRUPTIONS FOR MAP PLOTTING (FR-01) ---
const getActiveOutages = async (req, res) => {
  try {
    const currentOutages = await Outage.find({ status: { $ne: 'RESOLVED' } });
    return res.status(200).json(currentOutages);
  } catch (error) {
    console.error('Map plotter fetch error:', error);
    return res.status(500).json({ error: 'Internal server error pulling active incident markers.' });
  }
};

// --- SUBMIT NEW OUTAGE COMPLAINT LOGIC ROUTINE (FR-02) ---
const createOutageReport = async (req, res) => {
  try {
    const {
      utilityType,
      locationName,
      latitude,
      longitude,
      description,
      estimatedRestoration,
      reporterId,
      reporterName
    } = req.body;

    if (!utilityType || !locationName || !latitude || !longitude || !description || !reporterId || !reporterName) {
      return res.status(400).json({ error: 'All fields, including reporter details, are required.' });
    }

    const newReport = new Outage({
      utilityType,
      locationName,
      latitude: Number(latitude),
      longitude: Number(longitude),
      description,
      status: 'PENDING',
      estimatedRestoration: estimatedRestoration || 'Pending',
      reporterId,
      reporterName
    });

    await newReport.save();

    return res.status(201).json({
      message: 'Grid disruption vector mapped and submitted successfully to dispatch queue.',
      report: newReport
    });

  } catch (error) {
    console.error('Complaint submission transaction error:', error);
    return res.status(500).json({ error: 'Internal system fault recording grid failure report.' });
  }
};

// --- DELETE OUTAGE REPORT (FR-03) ---
const deleteOutageReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Outage.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await Outage.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Report deleted successfully.' });

  } catch (error) {
    console.error('Delete report error:', error);
    return res.status(500).json({ error: 'Internal server error deleting report.' });
  }
};

const assignTechnician = async (req, res) => {
  try {
    const { outageId, technicianId, technicianName } = req.body;

    if (!outageId || !technicianId || !technicianName) {
      return res.status(400).json({ error: 'outageId, technicianId and technicianName are required.' });
    }

    //Nusfat: for Checking if technician is ON_DUTY before assigning
    const User = require('../models/user');
    const technician = await User.findById(technicianId);
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found.' });
    }
    if (technician.status === 'OFF_DUTY') {
      return res.status(400).json({ error: 'Cannot assign task. This technician is currently OFF_DUTY.' });
    }
    //Nusfat End

    const updated = await Outage.findByIdAndUpdate(
      outageId,
      {
        assignedTo: technicianId,
        assignedToName: technicianName,
        status: 'ASSIGNED'
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Outage report not found.' });
    }

    return res.status(200).json({ message: 'Technician assigned successfully.', report: updated });

  } catch (error) {
    console.error('Assignment error:', error);
    return res.status(500).json({ error: 'Internal error assigning technician.' });
  }
};

const deleteOutage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Outage.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Report not found.' });
    return res.status(200).json({ message: 'Report deleted.' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Internal error deleting report.' });
  }
};

const getAssignedTasks = async (req, res) => {
  try {
    const { technicianId } = req.params;
    const tasks = await Outage.find({ assignedTo: technicianId });
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Task fetch error:', error);
    return res.status(500).json({ error: 'Internal error fetching tasks.' });
  }
};

const resolveOutage = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Outage.findByIdAndUpdate(id, { status: 'RESOLVED' }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Report not found.' });
    return res.status(200).json({ message: 'Task marked as resolved.', report: updated });
  } catch (error) {
    console.error('Resolve error:', error);
    return res.status(500).json({ error: 'Internal error resolving task.' });
  }
};

const getAllOutages = async (req, res) => {
  try {
    const allOutages = await Outage.find({});
    return res.status(200).json(allOutages);
  } catch (error) {
    console.error('All outages fetch error:', error);
    return res.status(500).json({ error: 'Internal error fetching all outages.' });
  }
};

// Turan: Community Upvote Outage Controller
const upvoteOutage = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required to upvote.' });
    }

    const outage = await Outage.findById(id);
    if (!outage) {
      return res.status(404).json({ error: 'Outage report not found.' });
    }

    if (outage.reporterId === userId) {
      return res.status(400).json({ error: 'You cannot upvote your own outage report.' });
    }

    let existingIndex = -1;
    for (let i = 0; i < outage.upvotedBy.length; i++) {
      if (outage.upvotedBy[i] === userId) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex !== -1) {
      outage.upvotedBy.splice(existingIndex, 1);
      outage.upvotes = outage.upvotes - 1;

      await outage.save();

      return res.status(200).json({
        message: 'Outage confirmation removed successfully.',
        report: outage
      });
    }

    outage.upvotedBy.push(userId);
    outage.upvotes = outage.upvotes + 1;

    await outage.save();

    return res.status(200).json({
      message: 'Outage confirmed successfully.',
      report: outage
    });

  } catch (error) {
    console.error('Upvote outage error:', error);
    return res.status(500).json({ error: 'Internal server error processing upvote.' });
  }
};
//Turan End
// ahnaf start
const VALID_CREW_STATUSES = ['ON_WAY', 'ON_SITE', 'RESOLVED'];

const updateOutageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_CREW_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_CREW_STATUSES.join(', ')}`
      });
    }

    const updated = await Outage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Outage report not found.' });
    }

    return res.status(200).json({
      message: `Outage status updated to ${status}.`,
      report: updated
    });

  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({ error: 'Internal error updating outage status.' });
  }
};
// ahnaf end

// --- SUBMIT RESIDENT REVIEW FOR A RESOLVED OUTAGE ---
const submitOutageReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, rating, comment } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ error: 'userId and rating are required.' });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number between 1 and 5.' });
    }

    const outage = await Outage.findById(id);
    if (!outage) {
      return res.status(404).json({ error: 'Outage report not found.' });
    }

    // Only the resident who filed the report can review it
    if (outage.reporterId !== userId) {
      return res.status(403).json({ error: 'Only the original reporter can review this outage.' });
    }

    // Reviews are only allowed once the job is marked resolved
    if (outage.status !== 'RESOLVED') {
      return res.status(400).json({ error: 'This outage must be resolved before it can be reviewed.' });
    }

    outage.userRating = numericRating;
    outage.userComment = comment || '';

    await outage.save();

    return res.status(200).json({
      message: 'Review submitted successfully.',
      report: outage
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return res.status(500).json({ error: 'Internal error submitting review.' });
  }
};

// Turan: Update live technician GPS coordinates (Location Feature)
const updateTechnicianLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude and longitude are required.' });
    }

    const updated = await Outage.findByIdAndUpdate(
      id,
      {
        technicianLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Outage report not found.' });
    }

    return res.status(200).json({
      message: 'Technician location updated.',
      report: updated
    });

  } catch (error) {
    console.error('Technician location update error:', error);
    return res.status(500).json({ error: 'Internal error updating technician location.' });
  }
};
// Turan End


module.exports = {
  getActiveOutages,
  createOutageReport,
  deleteOutageReport,
  assignTechnician,
  deleteOutage,
  getAssignedTasks,
  resolveOutage,
  getAllOutages,
  upvoteOutage,
  submitOutageReview,
  // ahnaf start
  updateOutageStatus,
  // ahnaf end
  // Turan: Live Technician Location Tracking export (Location Feature)
  updateTechnicianLocation
  // Turan End
};