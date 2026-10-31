/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Core Type Definitions
 */

export type AppMode = 'companion' | 'emergency';

export type ScreenId = 
  | 'home'
  | 'onboarding'
  | 'permissions'
  | 'companion'
  | 'scene_describe'
  | 'text_reader'
  | 'find_object'
  | 'voice_ask'
  | 'acoustic_mapper'
  | 'emergency'
  | 'sos_confirm'
  | 'sos_status'
  | 'contacts'
  | 'location_profile'
  | 'offline_guide'
  | 'history'
  | 'capabilities'
  | 'settings'
  | 'native_code';

export interface AcousticEcho {
  id: string;
  distanceMeters: number;
  angleDegrees: number;
  amplitude: number; // 0 to 1
  isGhostEcho: boolean;
  rejectionReason?: 'second_order_multipath' | 'harmonic_delay' | 'geometric_impossibility';
  confidence: number;
  timeOfFlightMs: number;
}

export interface AcousticObstacle {
  id: string;
  xMeters: number; // relative Cartesian coordinate
  yMeters: number;
  distanceMeters: number;
  angleDegrees: number;
  type: 'static_wall' | 'walking_person' | 'doorway_opening';
  persistenceScore: number; // 0 to 1, increases if stationary, decays if transient walking person
  firstObservedTimestamp: number;
  lastObservedTimestamp: number;
  speedMps?: number;
  statusLabel: string;
}

export interface HardwareLatencyConfig {
  speakerDelayMs: number;
  micBufferDelayMs: number;
  totalLoopbackDelayMs: number;
  calibrationStatus: 'calibrated' | 'uncalibrated' | 'calibrating';
  deviceProfileName: string;
  speedOfSoundMetersPerSec: number;
  lastCalibratedTimestamp?: number;
}

export interface AcousticSonarScanResult {
  timestamp: number;
  rawEchoes: AcousticEcho[];
  validWalls: AcousticObstacle[];
  suppressedGhostWalls: AcousticEcho[];
  trackedWalkingPeople: AcousticObstacle[];
  roomDimensionsEstimate: { widthM: number; depthM: number; clearanceAheadM: number };
  spokenSummary: string;
  ambientNoiseFloorDb: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: number;
}

export interface EmergencyProfile {
  fullName: string;
  bloodType: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  mobilityNeeds: string;
  emergencyNotes: string;
  updatedAt: number;
}

export interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null; // in meters
  altitude: number | null;
  timestamp: number | null;
  manualDescription: string;
  source: 'gps' | 'network' | 'manual' | 'unavailable';
}

export type SosState =
  | 'ready'
  | 'awaiting_confirmation'
  | 'preparing_location'
  | 'location_unavailable'
  | 'opening_messaging_app'
  | 'awaiting_user_to_send'
  | 'sent_to_messaging_service'
  | 'delivery_report_received'
  | 'failed'
  | 'cancelled';

export interface SosAttempt {
  id: string;
  timestamp: number;
  triggerType: 'sos_button' | 'test_mode' | 'voice_trigger';
  state: SosState;
  recipientCount: number;
  recipientNames: string[];
  recipientNumbers: string[];
  messagePayload: string;
  location: UserLocation;
  pathwayUsed: 'sms_uri_prefilled' | 'direct_telephony_sms' | 'simulation_test';
  statusDetails: string;
  retryCount: number;
}

export interface EmergencyEvent {
  id: string;
  timestamp: number;
  type: 'sos_initiated' | 'sos_cancelled' | 'sos_dispatched' | 'guide_accessed' | 'location_shared' | 'profile_updated';
  title: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, unknown>;
}

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number; // 0 to 1
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  spatialPosition: 'left' | 'center-left' | 'center' | 'center-right' | 'right';
  estimatedRelativeDistance: 'near' | 'mid' | 'far' | 'unknown';
}

export interface SceneAnalysisResult {
  timestamp: number;
  summary: string;
  detectedObjects: DetectedObject[];
  dominantFeatures: string[];
  lightingCondition: 'good' | 'low_light' | 'overexposed' | 'normal';
  safetyNotice: string;
  processingTimeMs: number;
  engine: 'edge_quantized_mobilenet' | 'edge_feature_analyzer';
}

export interface OcrResult {
  timestamp: number;
  rawText: string;
  lines: string[];
  confidence: number;
  processingTimeMs: number;
  languageDetected?: string;
}

export interface ChecklistItem {
  id: string;
  category: 'earthquake' | 'flood' | 'fire' | 'severe_weather' | 'general';
  text: string;
  isCompleted: boolean;
  notes?: string;
}

export interface UserSettings {
  highContrast: boolean;
  speechRate: number; // 0.7 to 1.5
  speechPitch: number; // 0.8 to 1.3
  hapticEnabled: boolean;
  audioBeaconsEnabled: boolean;
  largeText: boolean;
  testModeEnabled: boolean;
  emergencyNumberDefault: string; // e.g., "911", "112"
  smsPathwayPreference: 'prefilled' | 'direct';
  autoSpeakResults: boolean;
  theme: 'dark' | 'light';
}
