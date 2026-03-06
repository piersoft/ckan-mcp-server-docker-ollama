import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { makeCkanRequest } from '../../src/utils/http';
import groupListFixture from '../fixtures/responses/group-list-success.json';
import groupShowFixture from '../fixtures/responses/group-show-success.json';
import groupSearchFixture from '../fixtures/responses/group-search-success.json';

vi.mock('axios');

describe('ckan_group_list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns list of groups', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: groupListFixture });

    const result = await makeCkanRequest(
      'http://demo.ckan.org',
      'group_list',
      {}
    );

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('title');
  });

  it('handles empty group list', async () => {
    const emptyResults = {
      help: 'http://demo.ckan.org/api/3/action/help_show?name=group_list',
      success: true,
      result: []
    };

    vi.mocked(axios.get).mockResolvedValue({ data: emptyResults });

    const result = await makeCkanRequest(
      'http://demo.ckan.org',
      'group_list',
      {}
    );

    expect(result).toEqual([]);
  });
});

describe('ckan_group_show', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns group details for valid ID', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: groupShowFixture });

    const result = await makeCkanRequest(
      'http://demo.ckan.org',
      'group_show',
      { id: 'environment' }
    );

    expect(result).toHaveProperty('id', 'group-1');
    expect(result).toHaveProperty('name', 'environment');
    expect(result).toHaveProperty('title', 'Environment');
  });

  it('includes datasets list', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: groupShowFixture });

    const result = await makeCkanRequest(
      'http://demo.ckan.org',
      'group_show',
      { id: 'environment' }
    );

    expect(result).toHaveProperty('packages');
    expect(result.packages).toBeInstanceOf(Array);
  });
});

describe('ckan_group_search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches groups by pattern', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: groupSearchFixture });

    const result = await makeCkanRequest(
      'http://demo.ckan.org',
      'package_search',
      { q: 'groups:env*', rows: 0 }
    );

    expect(result).toHaveProperty('count');
    expect(result).toHaveProperty('search_facets');
  });
});
