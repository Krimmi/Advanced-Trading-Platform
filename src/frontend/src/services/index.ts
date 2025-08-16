// Export all services from a single file for easier imports
import api, { apiRequest } from './api';
import authService from './authService';
import marketService from './marketService';
import fundamentalService from './fundamentalService';
import portfolioService from './portfolioService';
import screenerService from './screenerService';
import technicalService from './technicalService';
import technicalServiceExtensions from './technicalServiceExtensions';
import { MLService } from './mlService';
import alertsService from './alertsService';
import alertExecutionService from './alertExecutionService';
import alertsServiceExtensions from './alertsServiceExtensions';
import aiNotificationService from './aiNotificationService';
import watchlistService from './watchlistService';
import settingsService from './settingsService';
import backtestService from './backtestService';
import websocketService from './websocketService';

export {
  api,
  apiRequest,
  authService,
  marketService,
  fundamentalService,
  portfolioService,
  screenerService,
  technicalService,
  technicalServiceExtensions,
  MLService,
  alertsService,
  alertExecutionService,
  alertsServiceExtensions,
  aiNotificationService,
  watchlistService,
  settingsService,
  backtestService,
  websocketService,
};