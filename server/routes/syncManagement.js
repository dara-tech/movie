const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminAuth');
const SyncJob = require('../models/SyncJob');
const syncService = require('../services/syncService');

// Apply admin middleware to all routes
router.use(requireAdmin);

// GET /api/admin/sync/jobs - Get all sync jobs
router.get('/jobs', async (req, res) => {
  try {
    // Initialize default jobs if none exist
    await syncService.initializeDefaultJobs();
    
    const syncJobs = await SyncJob.find().sort({ createdAt: 1 });
    
    // Synchronize database status with in-memory running state
    // If a job is marked as "running" in DB but not in memory, set it to "idle"
    for (const job of syncJobs) {
      const jobId = job._id.toString();
      const isActuallyRunning = syncService.isJobRunning(jobId);
      
      if (job.status === 'running' && !isActuallyRunning) {
        // Job is marked as running in DB but not actually running - fix it
        await SyncJob.findByIdAndUpdate(jobId, { 
          status: 'idle',
          errorMessage: null
        });
      }
    }
    
    // Re-fetch to get updated statuses
    const updatedJobs = await SyncJob.find().sort({ createdAt: 1 });
    res.json(updatedJobs);
  } catch (error) {
    console.error('Get sync jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sync jobs' });
  }
});

// GET /api/admin/sync/stats - Get sync statistics
router.get('/stats', async (req, res) => {
  try {
    const syncStats = await syncService.getSyncStats();
    res.json(syncStats);
  } catch (error) {
    console.error('Get sync stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sync statistics' });
  }
});

// POST /api/admin/sync/run/:jobId - Run a specific sync job
router.post('/run/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Run the sync job in the background
    syncService.runJob(jobId).catch(error => {
      console.error(`Background sync job ${jobId} failed:`, error);
    });

    res.json({ 
      success: true, 
      message: 'Sync job started successfully',
      jobId: jobId
    });

  } catch (error) {
    console.error('Run sync job error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to run sync job' });
  }
});

// POST /api/admin/sync/run-all - Run all enabled sync jobs
router.post('/run-all', async (req, res) => {
  try {
    const enabledJobs = await SyncJob.find({ isEnabled: true });
    
    if (enabledJobs.length === 0) {
      return res.status(400).json({ success: false, message: 'No enabled sync jobs found' });
    }

    // Start all enabled jobs in the background
    const jobPromises = enabledJobs.map(job => 
      syncService.runJob(job._id).catch(error => {
        console.error(`Background sync job ${job._id} failed:`, error);
        return { error: error.message };
      })
    );

    res.json({ 
      success: true, 
      message: `Started ${enabledJobs.length} sync jobs`,
      jobs: enabledJobs.map(job => ({ id: job._id, name: job.name }))
    });

  } catch (error) {
    console.error('Run all sync jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to run all sync jobs' });
  }
});

// POST /api/admin/sync/stop/:jobId - Stop a running sync job
router.post('/stop/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await syncService.stopJob(jobId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Stop sync job error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to stop sync job' });
  }
});

// PUT /api/admin/sync/jobs/:jobId - Update sync job configuration
router.put('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { isEnabled, config } = req.body;
    
    const job = await SyncJob.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Sync job not found' });
    }

    // Update job configuration
    const updateData = {};
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (config) updateData.config = { ...job.config, ...config };

    const updatedJob = await SyncJob.findByIdAndUpdate(jobId, updateData, { new: true });

    res.json({ 
      success: true, 
      message: 'Sync job configuration updated successfully',
      job: updatedJob
    });

  } catch (error) {
    console.error('Update sync job error:', error);
    res.status(500).json({ success: false, message: 'Failed to update sync job' });
  }
});

// GET /api/admin/sync/jobs/:jobId/logs - Get logs for a specific sync job
// MUST be before /jobs/:jobId to avoid route conflicts
router.get('/jobs/:jobId/logs', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await SyncJob.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Sync job not found' });
    }

    // Return logs sorted by timestamp (newest first), limit to last 100
    // Ensure logs exist and is an array
    const logs = Array.isArray(job.logs) && job.logs.length > 0 
      ? job.logs.slice(0, 100).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      : [];

    res.json({ 
      success: true, 
      logs: logs
    });

  } catch (error) {
    console.error('Get sync job logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sync job logs' });
  }
});

// GET /api/admin/sync/jobs/:jobId - Get specific sync job details
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await SyncJob.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Sync job not found' });
    }

    res.json(job);

  } catch (error) {
    console.error('Get sync job error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sync job' });
  }
});

// POST /api/admin/sync/pause/:jobId - Pause a running sync job
router.post('/pause/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await SyncJob.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Sync job not found' });
    }

    if (job.status !== 'running') {
      return res.status(400).json({ success: false, message: 'Sync job is not running' });
    }

    await SyncJob.findByIdAndUpdate(jobId, { status: 'paused' });

    res.json({ 
      success: true, 
      message: `Sync job '${job.name}' paused successfully`,
      job: await SyncJob.findById(jobId)
    });

  } catch (error) {
    console.error('Pause sync job error:', error);
    res.status(500).json({ success: false, message: 'Failed to pause sync job' });
  }
});

// POST /api/admin/sync/resume/:jobId - Resume a paused sync job
router.post('/resume/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await SyncJob.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Sync job not found' });
    }

    if (job.status !== 'paused') {
      return res.status(400).json({ success: false, message: 'Sync job is not paused' });
    }

    await SyncJob.findByIdAndUpdate(jobId, { status: 'running' });

    res.json({ 
      success: true, 
      message: `Sync job '${job.name}' resumed successfully`,
      job: await SyncJob.findById(jobId)
    });

  } catch (error) {
    console.error('Resume sync job error:', error);
    res.status(500).json({ success: false, message: 'Failed to resume sync job' });
  }
});

// POST /api/admin/sync/stop/:jobId - Stop a running sync job
router.post('/stop/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const result = await syncService.stopJob(jobId);

    res.json({ 
      success: true, 
      message: 'Sync job stopped successfully',
      ...result
    });

  } catch (error) {
    console.error('Stop sync job error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to stop sync job' });
  }
});

module.exports = router;
