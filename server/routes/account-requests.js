const express = require('express');
const { supabaseAdmin } = require('../config/supabase-client');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * GET /api/account-requests/status
 * Check account requests service status
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'operational',
      features: {
        requestAccount: true,
        viewPendingRequests: true,
        approveRequests: true,
        rejectRequests: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

/**
 * POST /api/account-requests
 * Request a new account (public endpoint, no auth required)
 */
router.post('/', async (req, res) => {
  try {
    const { email, fullName, phone, role } = req.body;

    // Validate required fields
    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Email and full name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Default role to 'user' if not specified
    const userRole = role || 'user';
    const validRoles = ['user', 'finance_officer', 'hr_officer', 'pastor'];
    
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Check if email already exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Check if request already exists
    const { data: existingRequest } = await supabaseAdmin
      .from('account_requests')
      .select('id, status')
      .eq('email', email)
      .limit(1);

    if (existingRequest && existingRequest.length > 0) {
      const request = existingRequest[0];
      if (request.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Account request already pending for this email'
        });
      } else if (request.status === 'approved') {
        return res.status(400).json({
          success: false,
          error: 'Email already has an approved request'
        });
      }
    }

    // Create account request
    const { data: newRequest, error: createError } = await supabaseAdmin
      .from('account_requests')
      .insert([{
        email,
        full_name: fullName,
        phone: phone || '',
        role: userRole,
        status: 'pending',
        requested_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating account request:', createError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create account request'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account request submitted successfully. Admin will review and contact you.',
      request: {
        id: newRequest.id,
        email: newRequest.email,
        fullName: newRequest.full_name,
        status: newRequest.status,
        createdAt: newRequest.created_at
      }
    });

  } catch (error) {
    console.error('Account request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/account-requests
 * Get all account requests (admin only)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can view account requests'
      });
    }

    const { status } = req.query;
    let query = supabaseAdmin
      .from('account_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching account requests:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch requests'
      });
    }

    res.json({
      success: true,
      requests: requests.map(req => ({
        id: req.id,
        email: req.email,
        fullName: req.full_name,
        phone: req.phone,
        role: req.role,
        status: req.status,
        rejectionReason: req.rejection_reason,
        adminNotes: req.admin_notes,
        requestedAt: req.requested_at,
        reviewedAt: req.reviewed_at,
        reviewedBy: req.reviewed_by
      })),
      total: requests.length
    });

  } catch (error) {
    console.error('Get account requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/account-requests/:requestId
 * Get a specific account request (admin only)
 */
router.get('/:requestId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can view account requests'
      });
    }

    const { data: request, error } = await supabaseAdmin
      .from('account_requests')
      .select('*')
      .eq('id', req.params.requestId)
      .single();

    if (error || !request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      request: {
        id: request.id,
        email: request.email,
        fullName: request.full_name,
        phone: request.phone,
        role: request.role,
        status: request.status,
        rejectionReason: request.rejection_reason,
        adminNotes: request.admin_notes,
        requestedAt: request.requested_at,
        reviewedAt: request.reviewed_at,
        reviewedBy: request.reviewed_by
      }
    });

  } catch (error) {
    console.error('Get account request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/account-requests/:requestId/approve
 * Approve an account request and create user (admin only)
 */
router.post('/:requestId/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can approve requests'
      });
    }

    const { password, adminNotes } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Get request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('account_requests')
      .select('*')
      .eq('id', req.params.requestId)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve request with status: ${request.status}`
      });
    }

    // Hash password
    const { hashPassword } = require('../utils/password-utils');
    const passwordHash = hashPassword(password);

    // Create user
    const { data: newUser, error: createUserError } = await supabaseAdmin
      .from('users')
      .insert([{
        email: request.email,
        password_hash: passwordHash,
        full_name: request.full_name,
        phone: request.phone || '',
        role: request.role,
        is_active: true
      }])
      .select()
      .single();

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user account'
      });
    }

    // Update request status
    const { error: updateError } = await supabaseAdmin
      .from('account_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.userId,
        admin_notes: adminNotes || ''
      })
      .eq('id', req.params.requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update request status'
      });
    }

    res.json({
      success: true,
      message: 'Account request approved and user created',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/account-requests/:requestId/reject
 * Reject an account request (admin only)
 */
router.post('/:requestId/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can reject requests'
      });
    }

    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    // Get request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('account_requests')
      .select('*')
      .eq('id', req.params.requestId)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot reject request with status: ${request.status}`
      });
    }

    // Update request status
    const { error: updateError } = await supabaseAdmin
      .from('account_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        admin_notes: adminNotes || '',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.userId
      })
      .eq('id', req.params.requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update request status'
      });
    }

    res.json({
      success: true,
      message: 'Account request rejected',
      request: {
        id: request.id,
        email: request.email,
        status: 'rejected',
        rejectionReason
      }
    });

  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/account-requests/status
 * Check account requests service status
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'operational',
      features: {
        requestAccount: true,
        viewPendingRequests: true,
        approveRequests: true,
        rejectRequests: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
