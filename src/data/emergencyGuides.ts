/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - Verified Offline Emergency Protocols & Checklists
 * Reviewed life-safety procedures for Earthquakes, Floods, Fires, and Severe Weather.
 * 100% available without network access.
 */

export interface EmergencyGuide {
  id: string;
  category: 'earthquake' | 'flood' | 'fire' | 'severe_weather' | 'general';
  title: string;
  shortSummary: string;
  iconName: string;
  immediateActions: string[];
  duringDisaster: string[];
  aftermathSafety: string[];
  sensoryMobilityTips: string[];
  authoritativeSource: string;
  criticalDisclaimer: string;
}

export const EMERGENCY_GUIDES: EmergencyGuide[] = [
  {
    id: 'guide_earthquake',
    category: 'earthquake',
    title: 'Earthquake Safety & Evacuation',
    shortSummary: 'Drop, Cover, and Hold On. Protect head and neck. Avoid glass and unanchored fixtures.',
    iconName: 'Activity',
    immediateActions: [
      'DROP to your hands and knees immediately to avoid being knocked down.',
      'COVER your head and neck with your arms, or crawl under a sturdy desk or table.',
      'HOLD ON to your shelter until shaking stops completely.',
      'If in bed, stay there, curl face down, and cover your head with pillows.',
    ],
    duringDisaster: [
      'DO NOT run outside while shaking is occurring; falling facade debris is the primary hazard.',
      'DO NOT use elevators under any circumstances.',
      'Stay away from windows, tall unanchored bookcases, and heavy suspended lighting.',
    ],
    aftermathSafety: [
      'Expect aftershocks. Each aftershock requires Drop, Cover, Hold On.',
      'Check yourself and immediate companions for injuries before moving.',
      'If you smell natural gas or hear hissing, turn off the main gas valve if trained and safe, and evacuate.',
      'Wear sturdy shoes to protect your feet from broken glass and debris.',
    ],
    sensoryMobilityTips: [
      'If using a white cane, keep it within arm reach. Tap ahead carefully for fallen floor debris.',
      'If using a wheelchair, lock brakes, cover head with arms or a bag, and remain seated.',
      'Call out with a whistle if trapped; saves vocal stamina over shouting.',
    ],
    authoritativeSource: 'FEMA / USGS Earthquake Safety Guidelines',
    criticalDisclaimer: 'EchoMap Edge Edge AI cannot determine structural stability or safe floor loads. Follow qualified rescue personnel.',
  },
  {
    id: 'guide_flood',
    category: 'flood',
    title: 'Flood & Flash Flood Response',
    shortSummary: 'Turn Around, Don’t Drown. Seek high ground immediately. Avoid floodwaters.',
    iconName: 'Waves',
    immediateActions: [
      'Move immediately to higher ground or upper building levels.',
      'Never walk, swim, or drive through floodwaters. 6 inches of moving water can knock an adult down.',
      'Disconnect electrical appliances if safe to do so before water enters the area.',
    ],
    duringDisaster: [
      'Do not touch electrical equipment if you are wet or standing in water.',
      'Avoid basements and enclosed ground-level crawlspaces where water can trap occupants.',
      'If water rises inside your building, move to the roof only if necessary; signal for help with bright fabric or a whistle.',
    ],
    aftermathSafety: [
      'Return home only when local authorities declare the area safe.',
      'Assume all floodwater is contaminated with sewage, chemicals, or downed power lines.',
      'Boil tap water or use bottled supplies until water utility safety is confirmed.',
    ],
    sensoryMobilityTips: [
      'Submerged floor obstacles are invisible to touch and sight. Use a rigid cane to test water depth and open grates.',
      'Keep your emergency phone sealed in a waterproof plastic pouch.',
    ],
    authoritativeSource: 'NOAA National Weather Service / Red Cross Flood Protocols',
    criticalDisclaimer: 'Never rely on camera vision to gauge flood depth. Water refraction obscures true depth.',
  },
  {
    id: 'guide_fire',
    category: 'fire',
    title: 'Structure Fire & Smoke Evacuation',
    shortSummary: 'Get out and stay out. Crawl low under smoke. Feel doors with the back of your hand.',
    iconName: 'Flame',
    immediateActions: [
      'Alert all occupants immediately and evacuate via your predetermined escape route.',
      'Feel closed doors with the back of your hand before opening. If hot, do not open—use second exit.',
      'Crawl low under smoke; cleaner, cooler air is within 12–24 inches of the floor.',
    ],
    duringDisaster: [
      'If clothes catch fire: Stop, Drop, and Roll until flames are extinguished.',
      'Never use elevators during a fire; use fire-rated enclosed stairwells.',
      'Close doors behind you as you leave to slow smoke and fire spread.',
    ],
    aftermathSafety: [
      'Once outside, stay outside. Never re-enter a burning building for belongings.',
      'Meet at your designated assembly point and dispatch an emergency SOS alert.',
      'Inform firefighters immediately if anyone remains unaccounted for.',
    ],
    sensoryMobilityTips: [
      'Maintain one hand trailing along the wall to maintain orientation in heavy smoke.',
      'Keep a damp cloth over your mouth and nose to filter coarse particulate matter.',
    ],
    authoritativeSource: 'National Fire Protection Association (NFPA)',
    criticalDisclaimer: 'Never enter a smoke-filled corridor if an alternate safe exit is available.',
  },
  {
    id: 'guide_severe_weather',
    category: 'severe_weather',
    title: 'Tornado & Severe Storm Shelter',
    shortSummary: 'Seek an interior room on the lowest floor. Put as many walls between you and the outside.',
    iconName: 'Wind',
    immediateActions: [
      'Go to the lowest level (basement or storm cellar). If no basement, choose a small interior room (closet/bathroom).',
      'Stay away from windows, exterior doors, and outside walls.',
      'Protect your head and neck with a mattress, heavy blanket, or helmet.',
    ],
    duringDisaster: [
      'Do not open windows to "equalize pressure"; this myth increases damage risk.',
      'Avoid large-span roofs like auditoriums, gyms, or shopping malls.',
    ],
    aftermathSafety: [
      'Watch for downed power lines and ruptured gas lines.',
      'Check for structural sagging before walking through rooms.',
    ],
    sensoryMobilityTips: [
      'Keep your emergency grab-bag and sensory aids with you inside the shelter room.',
      'Wear sturdy shoes inside the shelter before the storm hits.',
    ],
    authoritativeSource: 'NOAA Storm Prediction Center',
    criticalDisclaimer: 'EchoMap Edge cannot detect approaching funnel clouds. Monitor local radio broadcast alerts.',
  },
];
