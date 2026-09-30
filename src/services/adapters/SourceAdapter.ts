// REUNIFY Source-Integration Architecture
// Extensible adapter pattern enabling hot-swapping between simulated fixtures
// and real institutional government/hospital REST/FHIR APIs.

import { SourceAdapter, SourceRecord, SearchQuery, HealthStatus, SourceType } from '../../types';
import { db } from '../../lib/supabaseClient';

export abstract class BaseSourceAdapter implements SourceAdapter {
  abstract sourceType: SourceType;
  abstract adapterKey: string;
  abstract name: string;

  async healthCheck(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      latency_ms: Math.floor(Math.random() * 40) + 15,
      message: 'Connection verified. In simulation/mock mode.',
      lastChecked: new Date().toISOString(),
    };
  }

  abstract search(query: SearchQuery): Promise<SourceRecord[]>;

  async getRecord(id: string): Promise<SourceRecord | null> {
    return db.getSourceRecordById(id);
  }

  abstract normalizeRecord(raw: unknown): Partial<SourceRecord>;
}

export class MockShelterAdapter extends BaseSourceAdapter {
  sourceType: SourceType = 'shelter';
  adapterKey = 'mock_shelter';
  name = 'State Disaster Shelter Registry (SDMA-ShelterNet)';

  async search(query: SearchQuery): Promise<SourceRecord[]> {
    const all = await db.getSourceRecords();
    return all.filter((r) => {
      if (r.source_type !== 'shelter') return false;
      if (query.district && r.district.toLowerCase() !== query.district.toLowerCase()) {
        return false;
      }
      if (query.gender && r.gender && r.gender.toLowerCase() !== query.gender.toLowerCase()) {
        return false;
      }
      return true;
    });
  }

  normalizeRecord(raw: any): Partial<SourceRecord> {
    return {
      source_type: 'shelter',
      external_id: raw.camp_bed_id || raw.external_id || `SH-${Math.floor(Math.random() * 900 + 100)}`,
      location_name: raw.camp_name || raw.location_name || 'Relief Shelter',
      district: raw.district || 'Unknown',
      recorded_at: raw.admission_timestamp || new Date().toISOString(),
      clothing_summary: raw.clothing || raw.clothing_summary,
      identifying_marks: raw.marks || raw.identifying_marks,
      wristband_tag: raw.wristband || raw.wristband_tag,
    };
  }
}

export class MockHospitalAdapter extends BaseSourceAdapter {
  sourceType: SourceType = 'hospital';
  adapterKey = 'mock_hospital';
  name = 'Integrated Health & Emergency Trauma Network (HIMS)';

  async search(query: SearchQuery): Promise<SourceRecord[]> {
    const all = await db.getSourceRecords();
    return all.filter((r) => {
      if (r.source_type !== 'hospital') return false;
      // If querying by wristband, allow across districts to catch cross-facility transfers
      if (query.wristband_tag && r.wristband_tag === query.wristband_tag) {
        return true;
      }
      if (query.district && r.district.toLowerCase() !== query.district.toLowerCase()) {
        return false;
      }
      return true;
    });
  }

  normalizeRecord(raw: any): Partial<SourceRecord> {
    return {
      source_type: 'hospital',
      external_id: raw.patient_uid || raw.external_id || `HP-${Math.floor(Math.random() * 900 + 100)}`,
      location_name: raw.hospital_name || raw.location_name || 'Emergency Trauma Center',
      district: raw.district || 'Unknown',
      recorded_at: raw.triage_timestamp || new Date().toISOString(),
      clothing_summary: raw.clothing_summary,
      identifying_marks: raw.identifying_marks,
      wristband_tag: raw.wristband_tag,
    };
  }
}

export class MockHelplineAdapter extends BaseSourceAdapter {
  sourceType: SourceType = 'helpline';
  adapterKey = 'mock_helpline';
  name = 'Central Distress & Helpline Triage (1070 / 1077)';

  async search(query: SearchQuery): Promise<SourceRecord[]> {
    const all = await db.getSourceRecords();
    return all.filter((r) => {
      if (r.source_type !== 'helpline') return false;
      if (query.district && r.district.toLowerCase() !== query.district.toLowerCase()) {
        return false;
      }
      return true;
    });
  }

  normalizeRecord(raw: any): Partial<SourceRecord> {
    return {
      source_type: 'helpline',
      external_id: raw.call_ticket_id || raw.external_id || `HL-${Math.floor(Math.random() * 900 + 100)}`,
      location_name: raw.sighting_location || raw.location_name || '1070 Sighting Log',
      district: raw.district || 'Unknown',
      recorded_at: raw.call_time || new Date().toISOString(),
      clothing_summary: raw.clothing_summary,
      identifying_marks: raw.identifying_marks,
    };
  }
}

export class MockNGOAdapter extends BaseSourceAdapter {
  sourceType: SourceType = 'ngo';
  adapterKey = 'mock_ngo';
  name = 'Allied Humanitarian NGOs & Field Volunteers Consortium';

  async search(query: SearchQuery): Promise<SourceRecord[]> {
    const all = await db.getSourceRecords();
    return all.filter((r) => {
      if (r.source_type !== 'ngo') return false;
      if (query.district && r.district.toLowerCase() !== query.district.toLowerCase()) {
        return false;
      }
      return true;
    });
  }

  normalizeRecord(raw: any): Partial<SourceRecord> {
    return {
      source_type: 'ngo',
      external_id: raw.volunteer_log_id || raw.external_id || `NGO-${Math.floor(Math.random() * 900 + 100)}`,
      location_name: raw.camp_or_station || raw.location_name || 'Humanitarian Field Post',
      district: raw.district || 'Unknown',
      recorded_at: raw.log_timestamp || new Date().toISOString(),
      clothing_summary: raw.clothing_summary,
      identifying_marks: raw.identifying_marks,
    };
  }
}

// Adapter Registry & Orchestrator
export class SourceAdapterRegistry {
  private adapters = new Map<string, SourceAdapter>();

  constructor() {
    this.register(new MockShelterAdapter());
    this.register(new MockHospitalAdapter());
    this.register(new MockHelplineAdapter());
    this.register(new MockNGOAdapter());
  }

  register(adapter: SourceAdapter) {
    this.adapters.set(adapter.adapterKey, adapter);
  }

  getAdapter(adapterKey: string): SourceAdapter | undefined {
    return this.adapters.get(adapterKey);
  }

  getAdapterBySourceType(sourceType: SourceType): SourceAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.sourceType === sourceType) return adapter;
    }
    return undefined;
  }

  getAllAdapters(): SourceAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const sourceRegistry = new SourceAdapterRegistry();
