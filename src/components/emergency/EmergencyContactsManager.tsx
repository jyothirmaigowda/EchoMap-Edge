/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Feature 2: Emergency Contacts Manager
 * Local Room-equivalent CRUD for trusted contacts with E.164 phone validation and primary contact designation.
 */

import React, { useState, useEffect } from 'react';
import { EmergencyContact } from '../../types';
import { dbService } from '../../services/db';
import { smsService } from '../../services/sms';
import { speechService } from '../../services/tts';
import { ArrowLeft, Plus, Trash2, Star, Phone, ShieldCheck, User, AlertCircle, Check } from 'lucide-react';

interface EmergencyContactsManagerProps {
  onBack: () => void;
}

export const EmergencyContactsManager: React.FC<EmergencyContactsManagerProps> = ({ onBack }) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Family');
  const [notes, setNotes] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
    speechService.speak('Emergency Contacts Manager. Add, review, or edit your trusted distress contacts.');
  }, []);

  const loadContacts = async () => {
    const list = await dbService.getContacts();
    setContacts(list);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = smsService.validatePhoneNumber(phone);
    if (!validation.isValid) {
      setFormError(validation.error || 'Invalid phone format.');
      speechService.speak(validation.error || 'Invalid phone number format.');
      return;
    }

    if (!name.trim()) {
      setFormError('Please enter contact name.');
      return;
    }

    const newContact: EmergencyContact = {
      id: 'ec_' + Date.now(),
      name: name.trim(),
      phone: validation.normalized,
      relationship: relationship.trim(),
      isPrimary: contacts.length === 0 ? true : isPrimary,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    // If marked primary, update others
    if (newContact.isPrimary) {
      for (const c of contacts) {
        if (c.isPrimary) {
          await dbService.saveContact({ ...c, isPrimary: false });
        }
      }
    }

    await dbService.saveContact(newContact);
    speechService.speak(`Saved ${newContact.name} as emergency contact.`);

    // Reset form
    setName('');
    setPhone('');
    setRelationship('Family');
    setNotes('');
    setIsPrimary(false);
    setShowAddForm(false);
    await loadContacts();
  };

  const handleDeleteContact = async (id: string, contactName: string) => {
    await dbService.deleteContact(id);
    speechService.speak(`Removed ${contactName} from emergency contacts.`);
    await loadContacts();
  };

  const handleSetPrimary = async (contact: EmergencyContact) => {
    for (const c of contacts) {
      await dbService.saveContact({ ...c, isPrimary: c.id === contact.id });
    }
    speechService.speak(`${contact.name} is now your primary emergency contact.`);
    await loadContacts();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back to Emergency Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Emergency Dashboard</span>
        </button>

        <span className="text-xs text-slate-500 font-mono">
          {contacts.length} Contact(s)
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Emergency Contacts
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          These trusted numbers receive your GPS location and distress message when SOS is triggered.
        </p>
      </header>

      {/* Privacy Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p>
          <strong>Privacy Guarantee:</strong> Contact details are stored exclusively in on-device SQLite / IndexedDB. They are never uploaded to remote servers or marketing databases.
        </p>
      </div>

      {/* Add Contact Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full min-h-[56px] p-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-base flex items-center justify-center gap-2 transition-transform shadow"
          aria-label="Add new trusted emergency contact"
        >
          <Plus className="w-5 h-5" />
          <span>Add Emergency Contact</span>
        </button>
      )}

      {/* Add Contact Form */}
      {showAddForm && (
        <form
          onSubmit={handleSaveContact}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 text-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
              New Emergency Contact
            </h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="contact-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Full Name:
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Miller"
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="contact-phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Telephone Number (with Country Code):
            </label>
            <input
              id="contact-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15551234567"
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="contact-rel" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Relationship:
              </label>
              <select
                id="contact-rel"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Family">Family Member</option>
                <option value="Spouse/Partner">Spouse / Partner</option>
                <option value="Caregiver">Caregiver / Nurse</option>
                <option value="Neighbor">Neighbor</option>
                <option value="Colleague">Colleague / Friend</option>
                <option value="Physician">Personal Physician</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="contact-notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notes (Optional):
              </label>
              <input
                id="contact-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Has building key, aware of visual needs"
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="is-primary"
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="is-primary" className="text-xs text-slate-700 dark:text-slate-300">
              Set as Primary Emergency Contact (first notified)
            </label>
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
          >
            Save Contact
          </button>
        </form>
      )}

      {/* Contacts List */}
      <section aria-label="Configured contacts list" className="space-y-3">
        {contacts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 space-y-2">
            <User className="w-10 h-10 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No emergency contacts configured yet.</p>
            <p className="text-xs">Add at least one trusted recipient so EchoMap Edge can prepare your SOS alerts.</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {contact.name}
                  </h3>
                  {contact.isPrimary && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>Primary</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{contact.phone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{contact.relationship}</span>
                </div>
                {contact.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                    "{contact.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!contact.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(contact)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Make Primary
                  </button>
                )}

                <button
                  onClick={() => handleDeleteContact(contact.id, contact.name)}
                  className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors"
                  aria-label={`Delete ${contact.name} from contacts`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};
