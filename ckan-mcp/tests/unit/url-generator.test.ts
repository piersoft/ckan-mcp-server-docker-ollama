import { describe, it, expect } from 'vitest';
import { getDatasetViewUrl, getOrganizationViewUrl } from '../../src/utils/url-generator';

describe('url-generator', () => {
  const dataset = {
    id: 'test-dataset-id',
    name: 'test-dataset-name'
  };
  const organization = {
    id: 'test-org-id',
    name: 'test-org-name'
  };

  describe('getDatasetViewUrl', () => {
    it('uses custom template for exact URL match', () => {
      const url = getDatasetViewUrl('https://www.dati.gov.it/opendata', dataset);
      expect(url).toBe('https://www.dati.gov.it/view-dataset/dataset?id=test-dataset-id');
    });

    it('uses custom template for aliased URL (non-www)', () => {
      // Input URL is the alias
      const url = getDatasetViewUrl('https://dati.gov.it/opendata', dataset);
      // Expected output uses the template from configuration which has the canonical www URL
      expect(url).toBe('https://www.dati.gov.it/view-dataset/dataset?id=test-dataset-id');
    });

    it('uses custom template for aliased URL (http)', () => {
      const url = getDatasetViewUrl('http://dati.gov.it/opendata', dataset);
      expect(url).toBe('https://www.dati.gov.it/view-dataset/dataset?id=test-dataset-id');
    });

    it('uses default template for unknown server', () => {
      const url = getDatasetViewUrl('https://example.com', dataset);
      // Default template uses {server_url} which is replaced by input url
      expect(url).toBe('https://example.com/dataset/test-dataset-name');
    });
  });

  describe('getOrganizationViewUrl', () => {
    it('uses custom template for exact URL match with trailing slash', () => {
      const url = getOrganizationViewUrl('https://www.dati.gov.it/opendata/', organization);
      expect(url).toBe('https://www.dati.gov.it/view-dataset?organization=test-org-name');
    });

    it('uses custom template for aliased URL', () => {
      const url = getOrganizationViewUrl('http://dati.gov.it/opendata', organization);
      expect(url).toBe('https://www.dati.gov.it/view-dataset?organization=test-org-name');
    });

    it('uses default template for unknown server', () => {
      const url = getOrganizationViewUrl('https://example.com/', organization);
      expect(url).toBe('https://example.com/organization/test-org-name');
    });
  });
});
