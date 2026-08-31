const User = require('../models/user');
const VerificationId = require('../models/VerificationId');
// ahnaf start
const { verifyEmail } = require('../utils/emailVerifier');
// ahnaf end

// --- USER REGISTRATION LOGIC ROUTINE ---
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, username, password, role, employeeId, auditorId } = req.body;

    // --- STEP 1: VALIDATE REQUIRED VALUES ---
    if (!name || !email || !phone || !username || !password || role === undefined) {
      return res.status(400).json({ error: 'All primary demographic registration fields are mandatory.' });
    }

    // ahnaf start
    // --- STEP 1b: GMASS EMAIL VERIFICATION (syntax + DNS MX or live API) ---
    const emailCheckResult = await verifyEmail(email);
    if (emailCheckResult.status === 'Invalid') {
      return res.status(400).json({ error: 'Email Verification Failed: ' + emailCheckResult.message });
    }
    if (emailCheckResult.status === 'NoMxRecord') {
      return res.status(400).json({ error: 'Email Verification Failed: This email domain does not appear to be a real mail server. Please use a valid email address.' });
    }
    if (emailCheckResult.status === 'ConnectionFail') {
      return res.status(503).json({ error: 'Email Verification Unavailable: Could not verify your email address at this time. Please try again shortly.' });
    }
    // ahnaf end

    // --- STEP 2: UNIQUE USERNAME ENFORCEMENT CHECK ---
    const usernameTaken = await User.findOne({ username: username });

    if (usernameTaken) {
      return res.status(400).json({ error: 'This login username is already claimed by another user profile.' });
    }

    // --- STEP 3: UNIQUE EMAIL ENFORCEMENT CHECK ---
    const emailTaken = await User.findOne({ email: email });

    if (emailTaken) {
      return res.status(400).json({ error: 'This email identity is already registered inside our network system.' });
    }


    // --- STEP 4: STAFF CODE MATCHING (READ-ONLY CHECKS) ---
    let verificationRecordToUpdate = null;

    if (role === 'technician') {
      if (!employeeId) {
        return res.status(400).json({ error: 'Technician deployments require a valid operational Employee ID parameter.' });
      }

      const record = await VerificationId.findOne({ code: employeeId, type: 'technician' });

      if (!record) {
        return res.status(401).json({ error: 'Access Denied: Provided Employee ID is not recognized by system records.' });
      }

      if (record.used) {
        return res.status(401).json({ error: 'Access Denied: This Employee ID has already been claimed by another account.' });
      }

      verificationRecordToUpdate = record;
    }

    if (role === 'warehouse') {
      if (!auditorId) {
        return res.status(400).json({ error: 'Depot staff accounts require a valid verification Auditor ID parameter.' });
      }

      const record = await VerificationId.findOne({ code: auditorId, type: 'warehouse' });

      if (!record) {
        return res.status(401).json({ error: 'Access Denied: Provided Auditor ID is not recognized by system records.' });
      }

      if (record.used) {
        return res.status(401).json({ error: 'Access Denied: This Auditor ID has already been claimed by another account.' });
      }

      verificationRecordToUpdate = record;
    }


    // --- STEP 5: PERSIST NEW DOCUMENT OBJECT TO MONGO DB ---
    const freshUser = new User({
      name: name,
      email: email,
      phone: phone,
      username: username,
      password: password,
      role: role,
      employeeId: role === 'technician' ? employeeId : '',
      auditorId: role === 'warehouse' ? auditorId : '',
      address: ''
    });

    await freshUser.save();


    // --- STEP 6: MARK VERIFICATION ID AS USED ONLY AFTER SUCCESSFUL USER SAVE ---
    if (verificationRecordToUpdate !== null) {
      await VerificationId.findByIdAndUpdate(verificationRecordToUpdate._id, { 
        used: true, 
        usedBy: username 
      });
    }


    return res.status(201).json({ 
      message: 'Account node successfully initialized inside storage cluster!', 
      user: {
        username: freshUser.username,
        name: freshUser.name,
        role: freshUser.role
      }
    });

  } catch (error) {
    console.error('Registration pipeline error:', error);
    return res.status(500).json({ error: 'Internal pipeline fault processing registration payload data.' });
  }
};

// --- USER PORTAL ACCESS VERIFICATION LOGIC ---
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Please submit both credentials to attempt database access mapping.' });
    }

    const matchedProfile = await User.findOne({ username: username });

    if (!matchedProfile) {
      return res.status(401).json({ error: 'No matching user profile located with that identity handle.' });
    }

    if (matchedProfile.password !== password) {
      return res.status(401).json({ error: 'Authentication challenge failed: Secure credentials do not match.' });
    }

    return res.status(200).json({
      message: 'Portal verified. Welcome back to the infrastructure grid context.',
      user: {
        id: matchedProfile._id.toString(),
        name: matchedProfile.name,
        username: matchedProfile.username,
        role: matchedProfile.role,
        address: matchedProfile.address
      }
    });

  } catch (error) {
    console.error('Login validation error:', error);
    return res.status(500).json({ error: error.message || 'Internal system gateway error handling secure authorization request.' });
  }
};

// --- USER PROFILE ADDRESS UPDATE LOGIC ---
const updateProfile = async (req, res) => {
  try {
    const { username, address } = req.body;

    if (!username || !address) {
      return res.status(400).json({ error: 'Username and address parameters are required for persistence.' });
    }

    const updatedProfile = await User.findOneAndUpdate(
      { username: username },
      { address: address },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ error: 'No profile found to update.' });
    }

    return res.status(200).json({
      message: 'Account residential data updated within the primary storage cluster.',
      address: updatedProfile.address
    });

  } catch (error) {
    console.error('Profile update fault:', error);
    return res.status(500).json({ error: 'Internal system fault updating address record.' });
  }
};

const getTechnicians = async (req, res) => {
  try {
    //Nusfat: Added status field to include duty status
const technicians = await User.find({ role: 'technician' }, '_id name username status');
//Nusfat End
    return res.status(200).json(technicians);
  } catch (error) {
    console.error('Technician fetch error:', error);
    return res.status(500).json({ error: 'Internal error fetching technicians.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateProfile,
  getTechnicians
};