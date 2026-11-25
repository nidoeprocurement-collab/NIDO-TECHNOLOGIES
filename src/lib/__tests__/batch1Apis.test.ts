import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  deactivateNidoUserInSupabase,
  loadNidoUsersFromSupabase,
  setNidoUserStatusInSupabase,
  unlockNidoUserInSupabase,
  updateNidoUserInSupabase,
} from '@/lib/nidoUsersApi';
import {
  createClientOrganizationWithAdminInSupabase,
  loadClientOrganizationsFromSupabase,
} from '@/lib/clientOrganizationsApi';
import {
  loadClientAccessDataFromSupabase,
  saveClientRolePermissionsInSupabase,
} from '@/lib/clientAccessApi';
import {
  allocateDocumentNumberInSupabase,
  listDocumentSequencesFromSupabase,
  upsertDocumentSequenceInSupabase,
} from '@/lib/settingsApi';
import { fetchNidoAuditLogsFromSupabase } from '@/lib/auditLogsApi';
import {
  fetchActiveImpersonationSessionFromSupabase,
  startImpersonationInSupabase,
  stopImpersonationInSupabase,
} from '@/lib/impersonationApi';

describe('Batch 1 Supabase APIs (Identity, Client Tenants, Settings, Audit, Impersonation)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('loads and mutates internal nido_users via Supabase and manage-nido-users', async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          auth_user_id: '22222222-2222-4222-8222-222222222222',
          employee_id: 'EMP-00010',
          name: 'Alice Ops',
          email: 'alice@nido-tech.com',
          phone: '9999999999',
          role_id: '33333333-3333-4333-8333-333333333333',
          job_title: 'Ops Lead',
          designation: 'Manager',
          reporting_manager_name: null,
          department: 'Operations',
          status: 'Active',
          date_of_joining: null,
          force_password_change: false,
          last_login_at: '2026-11-24T00:00:00Z',
          created_at: '2026-11-20T00:00:00Z',
          updated_at: '2026-11-24T00:00:00Z',
          nido_roles: { id: '33333333-3333-4333-8333-333333333333', name: 'Operations Manager', is_system_owner: false },
        },
      ],
      error: null,
    });

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({ order: orderMock })),
    }));
    const invokeMock = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    (supabase as unknown as { functions: { invoke: unknown } }).functions = { invoke: invokeMock };

    const users = await loadNidoUsersFromSupabase();
    expect(users).toHaveLength(1);
    expect(users[0].role).toBe('Operations Manager');
    expect(users[0].employeeId).toBe('EMP-00010');

    await updateNidoUserInSupabase(users[0].id, { name: 'Alice Updated' });
    await setNidoUserStatusInSupabase(users[0].id, 'Suspended');
    await unlockNidoUserInSupabase(users[0].id);
    await deactivateNidoUserInSupabase(users[0].id);

    expect(invokeMock).toHaveBeenCalledWith('manage-nido-users', {
      body: { action: 'update_user', user_id: users[0].id, name: 'Alice Updated' },
    });
    expect(invokeMock).toHaveBeenCalledWith('manage-nido-users', {
      body: { action: 'set_status', user_id: users[0].id, status: 'Suspended' },
    });
    expect(invokeMock).toHaveBeenCalledWith('manage-nido-users', {
      body: { action: 'unlock_user', user_id: users[0].id },
    });
    expect(invokeMock).toHaveBeenCalledWith('manage-nido-users', {
      body: { action: 'deactivate_user', user_id: users[0].id },
    });
  });

  it('loads client_organizations and provisions org + admin via provision-client-access', async () => {
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: '44444444-4444-4444-8444-444444444444',
              client_code: 'CLI-001',
              nido_org_id: null,
              name: 'Acme Corp',
              category: 'Enterprise',
              tier: 'Premium',
              rep_name: 'Bob',
              email: 'bob@acme.test',
              phone: null,
              mobile: null,
              website: null,
              tax_id: null,
              pan: null,
              billing_address: null,
              billing_city: 'Bengaluru',
              billing_state: 'KA',
              billing_pincode: '560001',
              contract_start_date: null,
              contract_end_date: null,
              status: 'Active',
              archived_at: null,
              metadata: {},
              created_at: '2026-11-24T00:00:00Z',
              updated_at: '2026-11-24T00:00:00Z',
            },
          ],
          error: null,
        }),
      })),
    }));

    const invokeMock = vi.fn().mockResolvedValue({
      data: { success: true, client_id: '44444444-4444-4444-8444-444444444444', client_code: 'CLI-001' },
      error: null,
    });
    (supabase as unknown as { functions: { invoke: unknown } }).functions = { invoke: invokeMock };

    const orgs = await loadClientOrganizationsFromSupabase();
    expect(orgs).toHaveLength(1);
    expect(orgs[0].name).toBe('Acme Corp');

    const provisioned = await createClientOrganizationWithAdminInSupabase({
      clientName: 'Acme Corp',
      adminName: 'Bob Admin',
      adminEmail: 'bob@acme.test',
    });
    expect(provisioned.client_id).toBe('44444444-4444-4444-8444-444444444444');
    expect(invokeMock).toHaveBeenCalledWith('provision-client-access', {
      body: expect.objectContaining({
        action: 'create_client_organization_admin',
        client_name: 'Acme Corp',
        email: 'bob@acme.test',
      }),
    });
  });

  it('loads tenant-isolated client access data and saves client role permissions via manage-client-access', async () => {
    const clientId = '55555555-5555-4555-8555-555555555555';
    const roleId = '66666666-6666-4666-8666-666666666666';

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => ({
      select: vi.fn(() => {
        if (table === 'client_roles') {
          return {
            order: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: roleId, client_id: clientId, name: 'Buyer', description: 'Orders', status: 'Active' }],
                error: null,
              }),
            })),
          };
        }
        if (table === 'client_users') {
          return {
            order: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: '77777777-7777-4777-8777-777777777777',
                    auth_user_id: null,
                    client_id: clientId,
                    client_employee_code: 'CU-01',
                    user_type: 'client_user',
                    client_role_id: roleId,
                    name: 'Client Buyer',
                    email: 'buyer@acme.test',
                    phone: '',
                    department: 'Ops',
                    designation: 'Buyer',
                    status: 'Active',
                  },
                ],
                error: null,
              }),
            })),
          };
        }
        if (table === 'client_role_permissions') {
          return {
            eq: vi.fn().mockResolvedValue({
              data: [{ client_role_id: roleId, module_key: 'client_orders', can_view: true, can_create: true }],
              error: null,
            }),
          };
        }
        return {
          order: vi.fn().mockResolvedValue({
            data: [{ module_key: 'client_orders', label: 'Orders', description: 'Client orders' }],
            error: null,
          }),
        };
      }),
    }));

    const invokeMock = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    (supabase as unknown as { functions: { invoke: unknown } }).functions = { invoke: invokeMock };

    const access = await loadClientAccessDataFromSupabase(clientId);
    expect(access.roles[0].name).toBe('Buyer');
    expect(access.users[0].role_name).toBe('Buyer');
    expect(access.permissionsByRoleId[roleId].client_orders).toEqual({ view: true, create: true });

    await saveClientRolePermissionsInSupabase(clientId, roleId, { client_orders: { view: true } });
    expect(invokeMock).toHaveBeenCalledWith('manage-client-access', {
      body: {
        action: 'save_client_role_permissions',
        client_id: clientId,
        client_role_id: roleId,
        permissions: { client_orders: { view: true } },
      },
    });
  });

  it('calls document sequence, audit log, and impersonation RPCs/Edge Functions cleanly', async () => {
    const rpcMock = vi.fn(async (fnName: string) => {
      if (fnName === 'list_document_sequences') {
        return { data: [{ id: '1', seq_key: 'po', prefix: 'PO-', next_value: 42, pad_length: 5, include_year: true, year_separator: '-', description: null, updated_at: '' }], error: null };
      }
      if (fnName === 'upsert_document_sequence') {
        return { data: { id: '1', seq_key: 'po', prefix: 'PO-', next_value: 42, pad_length: 5, include_year: true, year_separator: '-', description: 'POs', updated_at: '' }, error: null };
      }
      if (fnName === 'allocate_document_number') {
        return { data: 'PO-2026-00042', error: null };
      }
      if (fnName === 'get_nido_audit_logs') {
        return { data: [{ id: 'a1', event_type: 'nido_roles.create', outcome: 'success', actor_auth_user_id: null, target_auth_user_id: null, target_scope: 'nido_internal', target_email_masked: null, client_id: null, request_id: null, details: {}, created_at: '2026-11-24T00:00:00Z' }], error: null };
      }
      return { data: null, error: null };
    });

    (supabase as unknown as { rpc: unknown }).rpc = rpcMock;
    const invokeMock = vi.fn().mockResolvedValue({
      data: {
        success: true,
        ended_count: 1,
        session: {
          id: '88888888-8888-4888-8888-888888888888',
          actor_nido_user_id: '11111111-1111-4111-8111-111111111111',
          target_client_user_id: '77777777-7777-4777-8777-777777777777',
          target_client_id: '55555555-5555-4555-8555-555555555555',
          mode: 'VIEW_ONLY',
          status: 'active',
          started_at: '2026-11-24T00:00:00Z',
          expires_at: '2026-11-24T01:00:00Z',
        },
      },
      error: null,
    });
    (supabase as unknown as { functions: { invoke: unknown } }).functions = { invoke: invokeMock };

    const seqs = await listDocumentSequencesFromSupabase();
    expect(seqs[0].seq_key).toBe('po');
    await upsertDocumentSequenceInSupabase({ seq_key: 'po', prefix: 'PO-', include_year: true });
    expect(await allocateDocumentNumberInSupabase('po')).toBe('PO-2026-00042');

    const logs = await fetchNidoAuditLogsFromSupabase({ limit: 50 });
    expect(logs[0].event_type).toBe('nido_roles.create');

    const started = await startImpersonationInSupabase('77777777-7777-4777-8777-777777777777');
    expect(started.status).toBe('active');
    const active = await fetchActiveImpersonationSessionFromSupabase();
    expect(active?.id).toBe('88888888-8888-4888-8888-888888888888');
    expect(await stopImpersonationInSupabase(started.id)).toBe(1);
  });
});

