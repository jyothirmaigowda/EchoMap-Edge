/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Local-First Storage (Room/SQLite equivalent for Web/PWA)
 * Complete offline autonomy, privacy-first, zero cloud analytics.
 */

import {
  EmergencyContact,
  EmergencyProfile,
  SosAttempt,
  EmergencyEvent,
  UserSettings,
  ChecklistItem,
} from '../types';

const DB_NAME = 'EchoMapEdgeDB';
const DB_VERSION = 1;

export class LocalDatabase {
  private db: IDBDatabase | null = null;
  private isInitializing: Promise<IDBDatabase> | null = null;

  async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.isInitializing) return this.isInitializing;

    this.isInitializing = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Emergency Contacts Store (Room Entity: EmergencyContactEntity)
        if (!db.objectStoreNames.contains('emergency_contacts')) {
          const store = db.createObjectStore('emergency_contacts', { keyPath: 'id' });
          store.createIndex('isPrimary', 'isPrimary', { unique: false });
        }

        // SOS Attempts Store (Room Entity: SosAttemptEntity)
        if (!db.objectStoreNames.contains('sos_attempts')) {
          const store = db.createObjectStore('sos_attempts', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('state', 'state', { unique: false });
        }

        // Emergency Events / Audit Log (Room Entity: EmergencyEventEntity)
        if (!db.objectStoreNames.contains('emergency_events')) {
          const store = db.createObjectStore('emergency_events', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('severity', 'severity', { unique: false });
        }

        // Emergency Profile (Room Entity: EmergencyProfileEntity)
        if (!db.objectStoreNames.contains('emergency_profile')) {
          db.createObjectStore('emergency_profile', { keyPath: 'id' });
        }

        // User Settings (Room Entity: UserSettingsEntity)
        if (!db.objectStoreNames.contains('user_settings')) {
          db.createObjectStore('user_settings', { keyPath: 'id' });
        }

        // Offline Checklists (Room Entity: ChecklistItemEntity)
        if (!db.objectStoreNames.contains('checklists')) {
          const store = db.createObjectStore('checklists', { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        await this.seedDefaultsIfEmpty();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('LocalDatabase open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.isInitializing;
  }

  // ---------------------------------------------------------------------------
  // DAOs: Emergency Contacts
  // ---------------------------------------------------------------------------
  async getContacts(): Promise<EmergencyContact[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('emergency_contacts', 'readonly');
      const store = tx.objectStore('emergency_contacts');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveContact(contact: EmergencyContact): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('emergency_contacts', 'readwrite');
      const store = tx.objectStore('emergency_contacts');
      const request = store.put(contact);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteContact(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('emergency_contacts', 'readwrite');
      const store = tx.objectStore('emergency_contacts');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---------------------------------------------------------------------------
  // DAOs: SOS Attempts
  // ---------------------------------------------------------------------------
  async getSosAttempts(): Promise<SosAttempt[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sos_attempts', 'readonly');
      const store = tx.objectStore('sos_attempts');
      const request = store.getAll();
      request.onsuccess = () => {
        const sorted = (request.result || []).sort((a, b) => b.timestamp - a.timestamp);
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async recordSosAttempt(attempt: SosAttempt): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sos_attempts', 'readwrite');
      const store = tx.objectStore('sos_attempts');
      const request = store.put(attempt);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---------------------------------------------------------------------------
  // DAOs: Emergency Events (Audit Trail)
  // ---------------------------------------------------------------------------
  async getEmergencyEvents(): Promise<EmergencyEvent[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('emergency_events', 'readonly');
      const store = tx.objectStore('emergency_events');
      const request = store.getAll();
      request.onsuccess = () => {
        const sorted = (request.result || []).sort((a, b) => b.timestamp - a.timestamp);
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async logEvent(event: Omit<EmergencyEvent, 'id'>): Promise<EmergencyEvent> {
    const db = await this.getDb();
    const fullEvent: EmergencyEvent = {
      ...event,
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction('emergency_events', 'readwrite');
      const store = tx.objectStore('emergency_events');
      const request = store.add(fullEvent);
      request.onsuccess = () => resolve(fullEvent);
      request.onerror = () => reject(request.error);
    });
  }

  // ---------------------------------------------------------------------------
  // DAOs: Emergency Profile (ICE)
  // ---------------------------------------------------------------------------
  async getProfile(): Promise<EmergencyProfile> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('emergency_profile', 'readonly');
      const store = tx.objectStore('emergency_profile');
      const request = store.get('current_profile');
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve({
            fullName: '',
            bloodType: 'Unknown',
            allergies: '',
            medicalConditions: '',
            medications: '',
            mobilityNeeds: 'Visual impairment - uses white cane/assistance',
            emergencyNotes: '',
            updatedAt: Date.now(),
          });
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveProfile(profile: EmergencyProfile): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('emergency_profile', 'readwrite');
      const store = tx.objectStore('emergency_profile');
      const request = store.put({ id: 'current_profile', data: profile });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---------------------------------------------------------------------------
  // DAOs: User Settings
  // ---------------------------------------------------------------------------
  async getSettings(): Promise<UserSettings> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('user_settings', 'readonly');
      const store = tx.objectStore('user_settings');
      const request = store.get('current_settings');
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve({
            highContrast: false,
            speechRate: 1.0,
            speechPitch: 1.0,
            hapticEnabled: true,
            audioBeaconsEnabled: true,
            largeText: true,
            testModeEnabled: false,
            emergencyNumberDefault: '911',
            smsPathwayPreference: 'prefilled',
            autoSpeakResults: true,
            theme: 'dark',
          });
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('user_settings', 'readwrite');
      const store = tx.objectStore('user_settings');
      const request = store.put({ id: 'current_settings', data: settings });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---------------------------------------------------------------------------
  // DAOs: Checklists
  // ---------------------------------------------------------------------------
  async getChecklist(): Promise<ChecklistItem[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('checklists', 'readonly');
      const store = tx.objectStore('checklists');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateChecklistItem(item: ChecklistItem): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('checklists', 'readwrite');
      const store = tx.objectStore('checklists');
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---------------------------------------------------------------------------
  // Privacy & Data Management
  // ---------------------------------------------------------------------------
  async wipeAllData(): Promise<void> {
    const db = await this.getDb();
    const stores = [
      'emergency_contacts',
      'sos_attempts',
      'emergency_events',
      'emergency_profile',
      'user_settings',
      'checklists',
    ];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, 'readwrite');
      stores.forEach((storeName) => tx.objectStore(storeName).clear());
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async exportAllData(): Promise<string> {
    const [contacts, sosAttempts, events, profile, settings, checklist] = await Promise.all([
      this.getContacts(),
      this.getSosAttempts(),
      this.getEmergencyEvents(),
      this.getProfile(),
      this.getSettings(),
      this.getChecklist(),
    ]);

    const backup = {
      app: 'EchoMap Edge',
      version: '1.0.0-edge',
      exportTimestamp: new Date().toISOString(),
      data: {
        contacts,
        sosAttempts,
        events,
        profile,
        settings,
        checklist,
      },
    };

    return JSON.stringify(backup, null, 2);
  }

  // Initial Seeds
  private async seedDefaultsIfEmpty() {
    if (!this.db) return;
    const countChecklist = await this.countStore('checklists');
    if (countChecklist === 0) {
      const defaultItems: ChecklistItem[] = [
        { id: 'c1', category: 'general', text: '3 days of water (1 gallon per person per day)', isCompleted: false },
        { id: 'c2', category: 'general', text: 'Non-perishable food & manual can opener', isCompleted: false },
        { id: 'c3', category: 'general', text: 'Battery or hand-crank emergency radio', isCompleted: true },
        { id: 'c4', category: 'general', text: 'Flashlight, tactile markers, extra batteries', isCompleted: true },
        { id: 'c5', category: 'general', text: 'First aid kit, prescription medications (7 days)', isCompleted: false },
        { id: 'c6', category: 'general', text: 'Backup white cane / sensory mobility aids', isCompleted: false },
        { id: 'c7', category: 'earthquake', text: 'Identify safe interior corners away from glass', isCompleted: true },
        { id: 'c8', category: 'earthquake', text: 'Know location of gas, water & electric shutoffs', isCompleted: false },
        { id: 'c9', category: 'flood', text: 'Evacuation route mapped to higher ground', isCompleted: false },
        { id: 'c10', category: 'fire', text: 'Two clear escape paths from bedroom & main rooms', isCompleted: false },
      ];
      const tx = this.db.transaction('checklists', 'readwrite');
      const store = tx.objectStore('checklists');
      defaultItems.forEach((item) => store.add(item));
    }

    const countContacts = await this.countStore('emergency_contacts');
    if (countContacts === 0) {
      const initialContacts: EmergencyContact[] = [
        {
          id: 'ec_1',
          name: 'Sarah Chen (Sister)',
          phone: '+15550198234',
          relationship: 'Immediate Family',
          isPrimary: true,
          notes: 'Has key to apartment, aware of visual impairment',
          createdAt: Date.now() - 86400000 * 3,
        },
        {
          id: 'ec_2',
          name: 'David Miller (Caregiver / Neighbor)',
          phone: '+15550143899',
          relationship: 'Local Emergency Contact',
          isPrimary: false,
          notes: 'Lives in building Apt 4B',
          createdAt: Date.now() - 86400000 * 2,
        },
      ];
      const tx = this.db.transaction('emergency_contacts', 'readwrite');
      const store = tx.objectStore('emergency_contacts');
      initialContacts.forEach((c) => store.add(c));
    }
  }

  private countStore(storeName: string): Promise<number> {
    if (!this.db) return Promise.resolve(0);
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }
}

export const dbService = new LocalDatabase();
