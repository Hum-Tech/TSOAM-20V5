const express = require('express');
const { supabaseAdmin, supabase } = require('../config/supabase-client');
const { verifyToken } = require('../services/auth-service');

const router = express.Router();

/**
 * Middleware to verify authentication token
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    const token = authHeader.slice(7);
    const result = verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = result.decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * GET /api/modules
 * Get all available modules
 */
router.get('/modules', async (req, res) => {
  try {
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('module_name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch modules', details: error.message });
    }

    // Fetch features for each module
    const modulesWithFeatures = await Promise.all(
      modules.map(async (module) => {
        const { data: features, error: featuresError } = await supabase
          .from('module_features')
          .select('*')
          .eq('module_id', module.id);

        return {
          ...module,
          features: features || [],
          featureCount: features ? features.length : 0,
        };
      })
    );

    res.json({
      success: true,
      modules: modulesWithFeatures,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/modules/purchased
 * Get modules purchased by the current church/tenant
 */
router.get('/modules/purchased', authMiddleware, async (req, res) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('church_subscriptions')
      .select('*, modules(*)')
      .eq('status', 'active');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch subscriptions', details: error.message });
    }

    const purchasedModules = subscriptions.map((sub) => ({
      ...sub.modules,
      subscriptionId: sub.id,
      purchaseDate: sub.purchase_date,
      activationDate: sub.activation_date,
      expirationDate: sub.expiration_date,
      licenseType: sub.license_type,
      maxUsers: sub.max_users,
      activeUsersCount: sub.active_users_count,
    }));

    res.json({
      success: true,
      modules: purchasedModules,
      total: purchasedModules.length,
    });
  } catch (error) {
    console.error('Error fetching purchased modules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/modules/:moduleId/access
 * Check if user has access to a specific module
 */
router.get('/modules/:moduleId/access', authMiddleware, async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Check if there's an active subscription for this module
    const { data: subscription, error } = await supabase
      .from('church_subscriptions')
      .select('*')
      .eq('module_id', moduleId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to check access', details: error.message });
    }

    const hasAccess = !!subscription;

    // Log access check
    await supabase
      .from('module_access_log')
      .insert([
        {
          user_id: req.user.id,
          module_id: moduleId,
          action: hasAccess ? 'access_granted' : 'access_denied',
          ip_address: req.ip,
        },
      ]);

    res.json({
      success: true,
      hasAccess,
      module: moduleId,
      subscription: hasAccess ? subscription : null,
    });
  } catch (error) {
    console.error('Error checking module access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/modules/purchase
 * Purchase/activate a module
 * Body: { moduleId, licenseType, maxUsers, paymentReference }
 */
router.post('/modules/purchase', authMiddleware, async (req, res) => {
  try {
    const { moduleId, licenseType = 'subscription', maxUsers = -1, paymentReference } = req.body;

    if (!moduleId) {
      return res.status(400).json({ error: 'Module ID is required' });
    }

    // Check if module exists
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Check if already purchased
    const { data: existingSubscription, error: checkError } = await supabase
      .from('church_subscriptions')
      .select('*')
      .eq('module_id', moduleId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return res.status(409).json({ 
        error: 'Module already purchased',
        subscription: existingSubscription 
      });
    }

    // Generate license key
    const licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Calculate expiration date
    let expirationDate = null;
    if (licenseType === 'subscription') {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      expirationDate = date.toISOString();
    } else if (licenseType === 'trial') {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      expirationDate = date.toISOString();
    }

    // Create subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('church_subscriptions')
      .insert([
        {
          module_id: moduleId,
          license_key: licenseKey,
          status: 'active',
          activation_date: new Date().toISOString(),
          expiration_date: expirationDate,
          license_type: licenseType,
          max_users: maxUsers,
          notes: paymentReference ? `Payment Ref: ${paymentReference}` : null,
        },
      ])
      .select()
      .single();

    if (subscriptionError) {
      return res.status(500).json({ 
        error: 'Failed to create subscription',
        details: subscriptionError.message 
      });
    }

    // Log purchase
    await supabase
      .from('module_access_log')
      .insert([
        {
          user_id: req.user.id,
          module_id: moduleId,
          action: 'module_activated',
          details: `Purchased with license type: ${licenseType}`,
          ip_address: req.ip,
        },
      ]);

    res.json({
      success: true,
      message: 'Module purchased successfully',
      subscription: {
        ...subscription,
        module,
      },
    });
  } catch (error) {
    console.error('Error purchasing module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/modules/:moduleId/activate
 * Activate a purchased module (admin only)
 */
router.post('/modules/:moduleId/activate', authMiddleware, async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Check user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can activate modules' });
    }

    // Update subscription status
    const { data: subscription, error } = await supabase
      .from('church_subscriptions')
      .update({ status: 'active', activation_date: new Date().toISOString() })
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to activate module', details: error.message });
    }

    // Log activation
    await supabase
      .from('module_access_log')
      .insert([
        {
          user_id: req.user.id,
          module_id: moduleId,
          action: 'module_activated',
          ip_address: req.ip,
        },
      ]);

    res.json({
      success: true,
      message: 'Module activated successfully',
      subscription,
    });
  } catch (error) {
    console.error('Error activating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/modules/:moduleId/deactivate
 * Deactivate a module (admin only)
 */
router.post('/modules/:moduleId/deactivate', authMiddleware, async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Check user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can deactivate modules' });
    }

    // Update subscription status
    const { data: subscription, error } = await supabase
      .from('church_subscriptions')
      .update({ status: 'inactive' })
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to deactivate module', details: error.message });
    }

    // Log deactivation
    await supabase
      .from('module_access_log')
      .insert([
        {
          user_id: req.user.id,
          module_id: moduleId,
          action: 'module_deactivated',
          ip_address: req.ip,
        },
      ]);

    res.json({
      success: true,
      message: 'Module deactivated successfully',
      subscription,
    });
  } catch (error) {
    console.error('Error deactivating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/modules/:moduleId
 * Get detailed information about a specific module
 */
router.get('/modules/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;

    const { data: module, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (error || !module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Fetch features
    const { data: features, error: featuresError } = await supabase
      .from('module_features')
      .select('*')
      .eq('module_id', moduleId);

    res.json({
      success: true,
      module: {
        ...module,
        features: features || [],
      },
    });
  } catch (error) {
    console.error('Error fetching module details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/modules/status/all
 * Get status of all modules for the current user
 */
router.get('/modules/status/all', authMiddleware, async (req, res) => {
  try {
    // Get all modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true);

    if (modulesError) {
      return res.status(500).json({ error: 'Failed to fetch modules' });
    }

    // Get purchased modules
    const { data: subscriptions, error: subsError } = await supabase
      .from('church_subscriptions')
      .select('module_id, status, activation_date, expiration_date, license_type')
      .eq('status', 'active');

    const purchasedModuleIds = new Set(subscriptions?.map((s) => s.module_id) || []);

    // Create status map
    const moduleStatuses = modules.map((module) => ({
      id: module.id,
      code: module.module_code,
      name: module.module_name,
      isPurchased: purchasedModuleIds.has(module.id),
      price_usd: module.price_usd,
      price_kes: module.price_kes,
    }));

    res.json({
      success: true,
      moduleStatuses,
      totalModules: modules.length,
      purchasedCount: purchasedModuleIds.size,
    });
  } catch (error) {
    console.error('Error fetching module statuses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
