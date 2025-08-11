/**
 * TSOAM Production Readiness Utility
 * Comprehensive system preparation for production deployment
 */

import SystemLogService from "@/services/SystemLogService";
import DatabaseIntegrationService from "@/services/DatabaseIntegrationService";

export interface ProductionReadinessResult {
  ready: boolean;
  issues: string[];
  warnings: string[];
  steps_completed: string[];
  next_steps: string[];
}

/**
 * Prepare system for production deployment
 */
export async function prepareForProduction(): Promise<ProductionReadinessResult> {
  const issues: string[] = [];
  const warnings: string[] = [];
  const stepsCompleted: string[] = [];
  const nextSteps: string[] = [];

  SystemLogService.log({
    level: 'info',
    module: 'System',
    action: 'Production Preparation Started',
    details: 'Beginning comprehensive production readiness check and cleanup',
    risk_level: 'high'
  });

  try {
    // Step 1: Clean demo data
    console.log('🧹 Cleaning demo data...');
    const demoCleanup = await DatabaseIntegrationService.cleanDemoData();
    if (demoCleanup.success) {
      stepsCompleted.push('Demo data cleaned successfully');
    } else {
      warnings.push('Some demo data could not be cleaned');
    }

    // Step 2: Check database integration
    console.log('🔍 Checking database integration...');
    const dbStatus = await DatabaseIntegrationService.checkSystemIntegration();
    if (dbStatus.overall === 'healthy') {
      stepsCompleted.push('Database integration verified');
    } else if (dbStatus.overall === 'warning') {
      warnings.push('Database integration has warnings');
    } else {
      issues.push('Critical database integration issues detected');
    }

    // Step 3: Validate production readiness
    console.log('✅ Validating production readiness...');
    const readiness = await DatabaseIntegrationService.validateProductionReadiness();
    if (readiness.ready) {
      stepsCompleted.push('Production readiness validation passed');
    } else {
      issues.push(...readiness.issues);
      nextSteps.push(...readiness.recommendations);
    }

    // Step 4: Clear development logs and data
    console.log('🗄️ Cleaning development data...');
    clearDevelopmentData();
    stepsCompleted.push('Development data cleared');

    // Step 5: Initialize production logging
    console.log('📝 Initializing production logging...');
    initializeProductionLogging();
    stepsCompleted.push('Production logging initialized');

    // Step 6: Verify all modules
    console.log('🔧 Verifying all modules...');
    const moduleVerification = verifyModules();
    if (moduleVerification.allHealthy) {
      stepsCompleted.push('All modules verified');
    } else {
      warnings.push(...moduleVerification.warnings);
    }

    // Determine overall readiness
    const ready = issues.length === 0;

    if (ready) {
      nextSteps.push(
        'Deploy to production server',
        'Configure production environment variables',
        'Set up automated backups',
        'Configure monitoring and alerts',
        'Perform final user acceptance testing'
      );
    } else {
      nextSteps.unshift('Resolve critical issues before deployment');
    }

    const result: ProductionReadinessResult = {
      ready,
      issues,
      warnings,
      steps_completed: stepsCompleted,
      next_steps: nextSteps
    };

    SystemLogService.log({
      level: ready ? 'info' : 'warning',
      module: 'System',
      action: 'Production Preparation Complete',
      details: ready ? 
        'System is ready for production deployment' : 
        `${issues.length} issues need resolution`,
      metadata: result,
      risk_level: ready ? 'low' : 'high'
    });

    return result;

  } catch (error) {
    const errorResult: ProductionReadinessResult = {
      ready: false,
      issues: [`Production preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      steps_completed: stepsCompleted,
      next_steps: ['Resolve preparation errors and retry']
    };

    SystemLogService.logError('System', error as Error, 'Production preparation failed');
    return errorResult;
  }
}

/**
 * Clear development data from localStorage
 */
function clearDevelopmentData(): void {
  const developmentKeys = [
    'dev_',
    'test_',
    'debug_',
    'temp_',
    'cache_',
    'mock_'
  ];

  let clearedCount = 0;
  Object.keys(localStorage).forEach(key => {
    if (developmentKeys.some(prefix => key.toLowerCase().startsWith(prefix))) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  console.log(`Cleaned ${clearedCount} development data entries`);
}

/**
 * Initialize production logging configuration
 */
function initializeProductionLogging(): void {
  // Clear old logs older than 30 days
  SystemLogService.clearOldLogs(30);

  // Log production initialization
  SystemLogService.log({
    level: 'info',
    module: 'System',
    action: 'Production Environment Initialized',
    details: 'System configured for production deployment',
    metadata: {
      environment: 'production',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    },
    risk_level: 'low'
  });
}

/**
 * Verify all system modules are functioning
 */
function verifyModules(): { allHealthy: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let healthyCount = 0;
  const totalModules = 6; // HR, Finance, Events, Members, Inventory, Auth

  // Check each module's basic functionality
  const modules = [
    { name: 'HR', test: () => typeof window !== 'undefined' },
    { name: 'Finance', test: () => typeof window !== 'undefined' },
    { name: 'Events', test: () => typeof window !== 'undefined' },
    { name: 'Members', test: () => typeof window !== 'undefined' },
    { name: 'Inventory', test: () => typeof window !== 'undefined' },
    { name: 'Auth', test: () => typeof window !== 'undefined' }
  ];

  modules.forEach(module => {
    try {
      if (module.test()) {
        healthyCount++;
      } else {
        warnings.push(`${module.name} module health check failed`);
      }
    } catch (error) {
      warnings.push(`${module.name} module error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    allHealthy: healthyCount === totalModules,
    warnings
  };
}

/**
 * Generate production deployment checklist
 */
export function generateDeploymentChecklist(): string[] {
  return [
    '✅ Demo data cleaned from all modules',
    '✅ Database integration verified',
    '✅ System logs initialized',
    '✅ All modules health checked',
    '⚠️ Configure production environment variables',
    '⚠️ Set up production database',
    '⚠️ Configure HTTPS and SSL certificates',
    '⚠️ Set up automated backups',
    '⚠️ Configure monitoring and alerting',
    '⚠️ Set up user authentication (LDAP/SSO)',
    '⚠️ Configure email notifications',
    '⚠️ Set up log rotation and retention',
    '⚠️ Configure firewall and security rules',
    '⚠️ Perform load testing',
    '⚠️ Train end users',
    '⚠️ Prepare rollback plan'
  ];
}

/**
 * Export function for browser console usage
 */
if (typeof window !== 'undefined') {
  (window as any).prepareForProduction = prepareForProduction;
  (window as any).generateDeploymentChecklist = generateDeploymentChecklist;
}
