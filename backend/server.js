require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const connectDatabase = require('./db');

// Import controllers
const { registerUser, loginUser, updateProfile, getTechnicians } = require('./controllers/authController');

const { getActiveOutages, createOutageReport, deleteOutageReport, assignTechnician, deleteOutage, getAssignedTasks, resolveOutage, getAllOutages, upvoteOutage, submitOutageReview, /* ahnaf start */ updateOutageStatus, /* ahnaf end */ /* Turan: Location Feature */ updateTechnicianLocation /* Turan End */ } = require('./controllers/outageController');

const { generateVerificationId, listVerificationIds, revokeVerificationId } = require('./controllers/verificationController');
const { getAllForumPosts, createForumPost, answerForumPost, updateForumPost, deleteForumPost, updateForumReply, deleteForumReply } = require('./controllers/forumController');
const { getAllFaqs, createFaq, updateFaq, deleteFaq, getAllCategories, createCategory, deleteCategory } = require('./controllers/faqController');
const { getAllSupplies, createSupply, recordShipment, getShipmentHistory, updateSupply } = require('./controllers/supplyController');
// Turan: Transaction Auditor Controller Import
const { submitBkashPayment, getAuditorTransactions, verifyTransaction, exportTransactionsCSV, getUserSubscription } = require('./controllers/transactionController');
// Turan End

const app = express();

// --- APPLY NETWORKING MIDDLEWARE ---
app.use(cors({
  origin: [
    'https://utility-management-system.vercel.app',
    'https://utility-management-system-m9bn.vercel.app',
    /^https:\/\/utility-management-system-.*-team-1-75cf\.vercel\.app$/,
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicitly handle preflight requests for all routes to prevent redirects
app.options(/(.*)/, cors());

app.use(express.json());

// --- ROOT HEALTH CHECK ROUTE ---
app.get('/', (req, res) => {
  res.send('Utilix Backend Server is running successfully!');
});

// --- INITIALIZE DATABASE CONNECTIVITY ---
connectDatabase();

// --- USER AUTHENTICATION ROUTE ENDPOINTS ---
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.post('/api/user/update', updateProfile);

app.get('/api/outages/active', getActiveOutages);
app.post('/api/outages/report', createOutageReport);
app.delete('/api/outages/delete/:id', deleteOutageReport);

// Turan: Community Upvote System (Feature 1)
app.post('/api/outages/upvote/:id', upvoteOutage);
// Turan End

app.get('/api/users/technicians', getTechnicians);
app.post('/api/outages/assign', assignTechnician);
app.delete('/api/outages/admin/delete/:id', deleteOutage);
app.get('/api/outages/all', getAllOutages);

// --- VERIFICATION ID ROUTE ENDPOINTS (admin only) ---
app.post('/api/verification/generate', generateVerificationId);
app.get('/api/verification/list', listVerificationIds);
app.delete('/api/verification/revoke/:id', revokeVerificationId);

//--- Technician Route Endpoints ---
app.get('/api/outages/assigned/:technicianId', getAssignedTasks);
app.post('/api/outages/resolve/:id', resolveOutage);
// ahnaf start
app.patch('/api/outages/status/:id', updateOutageStatus);
// ahnaf end
// Turan: Live Technician Location Route (Location Feature)
app.patch('/api/outages/location/:id', updateTechnicianLocation);
// Turan End

// ahnaf start
// --- Technician Live Crew Status Update (ON_WAY / ON_SITE / RESOLVED) ---
app.patch('/api/outages/status/:id', updateOutageStatus);
// ahnaf end

// --- Resident Review Route Endpoint ---
app.post('/api/outages/review/:id', submitOutageReview);

// --- TECHNICIAN FORUM ROUTE ENDPOINTS ---
app.get('/api/forum/all', getAllForumPosts);
app.post('/api/forum/create', createForumPost);
app.post('/api/forum/reply/:postId', answerForumPost);
app.put('/api/forum/update/:postId', updateForumPost);
app.delete('/api/forum/delete/:postId', deleteForumPost);
app.put('/api/forum/reply/update/:replyId', updateForumReply);
app.delete('/api/forum/reply/delete/:replyId', deleteForumReply);

// --- FAQ & CATEGORY ROUTE ENDPOINTS ---
app.get('/api/faqs', getAllFaqs);
app.get('/api/faqs/all', getAllFaqs);
app.post('/api/faqs/create', createFaq);
app.put('/api/faqs/update/:id', updateFaq);
app.delete('/api/faqs/delete/:id', deleteFaq);
app.get('/api/categories', getAllCategories);
app.post('/api/categories/create', createCategory);
app.delete('/api/categories/delete/:id', deleteCategory);

// --- WAREHOUSE SUPPLY & SHIPMENT ROUTE ENDPOINTS ---
app.get('/api/supplies', getAllSupplies);
app.post('/api/supplies/create', createSupply);
app.post('/api/supplies/shipment', recordShipment);
app.get('/api/supplies/shipments', getShipmentHistory);
app.put('/api/supplies/:id', updateSupply);


//NUSFAT: Chatbot Route - Module 4 (Gemini AI)
const { chat } = require('./controllers/chatbotController');
app.post('/api/chatbot/chat', chat);

//NUSFAT: Complaint Tracker Routes - Module 3
const { submitComplaint, trackComplaint, getAllComplaints, updateComplaint } = require('./controllers/complaintController');

app.post('/api/complaint/submit', submitComplaint);
app.get('/api/complaint/track/:trackingId', trackComplaint);
app.get('/api/complaint/all', getAllComplaints);
app.patch('/api/complaint/update/:trackingId', updateComplaint);

//NUSFAT: Banner Routes - Scroll Banner Publisher (Module 2)
const Banner = require('./models/Banner');

// Post new banner (stays active, doesn't deactivate old ones)
app.post('/api/banner/post', async (req, res) => {
  const { message } = req.body;
  try {
    if (!message) return res.status(400).json({ message: 'Message is required' });
    //NUSFAT: Removed auto-deactivate so old banners stay active
    const banner = await Banner.create({ message });

    //NUSFAT: Send email to all registered residents
    try {
      const nodemailer = require('nodemailer');
      const User = require('./models/User');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const residents = await User.find({ role: 'resident' }, 'email name');

      for (const resident of residents) {
        await transporter.sendMail({
          from: `"Utilix Emergency Alert" <${process.env.EMAIL_USER}>`,
          to: resident.email,
          subject: '🚨 Emergency Utility Announcement',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: white; padding: 30px; border-radius: 12px;">
              <h1 style="color: #ef4444; margin-bottom: 10px;">🚨 Emergency Announcement</h1>
              <p style="color: #94a3b8; font-size: 14px;">Dear ${resident.name},</p>
              <div style="background: #1e293b; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: white; font-size: 16px; margin: 0;">${message}</p>
              </div>
              <p style="color: #94a3b8; font-size: 12px;">This is an automated emergency alert from Utilix Management System.</p>
              <p style="color: #94a3b8; font-size: 12px;">Please log in to your account for more details and updates.</p>
            </div>
          `
        });
      }
      console.log(`Emergency email sent to ${residents.length} residents`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);

    }


    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all active banners for residents
app.get('/api/banner/active', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all banners for admin
app.get('/api/banner/all', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete specific banner by ID
app.delete('/api/banner/delete/:id', async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle banner active/inactive
app.patch('/api/banner/toggle/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    banner.isActive = !banner.isActive;
    await banner.save();
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//NUSFAT END

//NUSFAT: Shift Toggle Route for Duty Status Feature (Module 1)
app.patch('/api/user/toggle-status', async (req, res) => {
  try {
    const { userId } = req.body;
    const User = require('./models/User');
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.status = user.status === 'ON_DUTY' ? 'OFF_DUTY' : 'ON_DUTY';
    await user.save();
    res.json({ status: user.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//NUSFAT END

// Turan: Transaction Auditor - Control Manager (Stripe & bKash Payment Verification)
app.post('/api/transactions/bkash', submitBkashPayment);
app.get('/api/transactions/auditor/all', getAuditorTransactions);
app.patch('/api/transactions/auditor/verify/:id', verifyTransaction);
app.get('/api/transactions/auditor/export', exportTransactionsCSV);
app.get('/api/transactions/resident/:userId', getUserSubscription);
// Turan End


// Turan: Resident-Technician Chat Routes (Chat Feature)
const { getMessages, sendMessage } = require('./controllers/chatController');
app.get('/api/chat/:outageId', getMessages);
app.post('/api/chat/:outageId', sendMessage);
// Turan End

// --- STARTUP BOUNDARY ROUTINE ---
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('Utilix Secure Network Server active and executing on Port: ' + PORT);
  });
}

module.exports = app;