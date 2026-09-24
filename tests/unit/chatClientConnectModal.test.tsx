// =====================================================
// ChatClient — WhatsApp connect modal wiring
// =====================================================
// Regression coverage for the dead "Conectar WhatsApp" button:
// the sidebar button must trigger POST /api/seller/whatsapp/connect/init,
// render <WhatsAppConnectModal> with the returned pairing data on success,
// surface init errors via the snackbar, and close the modal on success.

import { ChatClient } from '@/app/[slug]/(app)/chat/components/ChatClient';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const BUSINESS_ID = '22222222-2222-4222-8222-222222222222';

// ── Mocks (vi.hoisted ensures availability inside vi.mock factories) ──

const {
  mockDeleteChatSession,
  mockFetchChatSessions,
  mockFetchMessages,
  mockSendMessage,
  mockFetchWhatsAppConversations,
  mockFetchWhatsAppMessages,
  mockSendWhatsAppMessage,
} = vi.hoisted(() => ({
  mockDeleteChatSession: vi.fn(),
  mockFetchChatSessions: vi.fn(),
  mockFetchMessages: vi.fn(),
  mockSendMessage: vi.fn(),
  mockFetchWhatsAppConversations: vi.fn(),
  mockFetchWhatsAppMessages: vi.fn(),
  mockSendWhatsAppMessage: vi.fn(),
}));

const fetchMock = vi.hoisted(() => vi.fn());

// Mutable env snapshot — tests flip the FB Embedded Signup envs on/off so the
// same file covers BOTH wiring branches: absent → pair-code fallback,
// present → coexistence modal.
const fbEnvMock = vi.hoisted(() => ({
  ycloudFbAppId: '',
  ycloudFbConfigId: '',
  ycloudFbSolutionId: '',
}));

vi.mock('@/config/env', () => ({ env: fbEnvMock }));

vi.mock('@/lib/supabase/client', () => {
  const channel = {
    on: () => channel,
    subscribe: (callback?: (status: string, error?: Error) => void) => {
      callback?.('SUBSCRIBED');
      return channel;
    },
  };
  return {
    createClient: () => ({
      channel: () => channel,
      removeChannel: vi.fn(),
    }),
  };
});

vi.mock('@/app/[slug]/(app)/chat/actions/chatActions', () => ({
  deleteChatSession: mockDeleteChatSession,
  fetchChatSessions: mockFetchChatSessions,
  fetchMessages: mockFetchMessages,
  sendMessage: mockSendMessage,
}));

vi.mock('@/app/[slug]/(app)/chat/actions/whatsappActions', () => ({
  fetchWhatsAppConversations: mockFetchWhatsAppConversations,
  fetchWhatsAppMessages: mockFetchWhatsAppMessages,
  sendWhatsAppMessage: mockSendWhatsAppMessage,
}));

// ── Helpers ─────────────────────────────────────────────

interface StubRoute {
  status?: number;
  body?: unknown;
}

type RouteFactory = () => StubRoute;

/** Stub global fetch with `METHOD url-prefix` routing (same as whatsappTemplateManager.test). */
function stubFetch(routes: Record<string, StubRoute | RouteFactory>): void {
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const matchingKey = Object.keys(routes).find((key) => {
      const [keyMethod, keyPrefix] = key.split(' ', 2);
      return keyMethod === method && keyPrefix && url.startsWith(keyPrefix);
    });
    if (!matchingKey) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    const entry = routes[matchingKey];
    const route: StubRoute = typeof entry === 'function' ? entry() : entry;
    return new Response(JSON.stringify(route.body ?? {}), { status: route.status ?? 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
}

function renderChatClient() {
  return render(
    <ChatClient
      slug="test-store"
      storeName="Test Store"
      storeDescription="Test description"
      storeLogo=""
      businessId={BUSINESS_ID}
      canRespond
      canManage
    />,
  );
}

/** Opens the WhatsApp tab on a disconnected channel so the connect button is visible. */
async function goToWhatsAppTab() {
  fireEvent.click(screen.getByRole('button', { name: 'WhatsApp' }));
  return screen.findByText('Conectar WhatsApp');
}

/** Simulates the FB Embedded Signup envs being configured on the server. */
function enableFbEnvs() {
  fbEnvMock.ycloudFbAppId = 'app-111';
  fbEnvMock.ycloudFbConfigId = 'config-222';
  fbEnvMock.ycloudFbSolutionId = 'solution-333';
}

/** Dispatches a WA_EMBEDDED_SIGNUP postMessage from the allowlisted origin
 *  using the REAL Meta wire shape: data is a JSON string, `event` UPPERCASE. */
function dispatchEmbeddedSignup(event: string, inner?: unknown) {
  window.dispatchEvent(
    new MessageEvent('message', {
      origin: 'https://www.facebook.com',
      data: JSON.stringify({ type: 'WA_EMBEDDED_SIGNUP', event, data: inner ?? null }),
    }),
  );
}

// ── Tests ───────────────────────────────────────────────

describe('ChatClient WhatsApp connect modal', () => {
  beforeEach(() => {
    // Default: FB Embedded Signup envs absent → pair-code fallback path.
    fbEnvMock.ycloudFbAppId = '';
    fbEnvMock.ycloudFbConfigId = '';
    fbEnvMock.ycloudFbSolutionId = '';
    mockFetchChatSessions.mockResolvedValue({ success: true, sessions: [] });
    mockFetchWhatsAppConversations.mockResolvedValue({
      success: true,
      conversations: [],
      channelConnected: false,
      channelId: null,
    });
    mockFetchWhatsAppMessages.mockResolvedValue({ success: true, messages: [] });
    mockSendWhatsAppMessage.mockResolvedValue({ success: false, error: 'not used' });
    mockDeleteChatSession.mockResolvedValue({ success: true });
    mockFetchMessages.mockResolvedValue({ success: true, messages: [] });
    mockSendMessage.mockResolvedValue({ success: true, message: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the connect modal with the pairing data after a successful init', async () => {
    stubFetch({
      'POST /api/seller/whatsapp/connect/init': {
        body: {
          phoneNumberId: 'pn-1001',
          code: 'ABC-123',
          expiresAt: '2026-12-31T23:59:59.000Z',
        },
      },
    });

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());

    // The init request must carry the business id.
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/seller/whatsapp/connect/init',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ businessId: BUSINESS_ID }),
      }),
    );

    // The modal renders with the code returned by the init endpoint.
    expect(await screen.findByText('ABC-123')).toBeInTheDocument();
    expect(screen.getByText('Ingresa este código en WhatsApp Business')).toBeInTheDocument();
  });

  it('surfaces the init error via the snackbar and does not open the modal', async () => {
    stubFetch({
      'POST /api/seller/whatsapp/connect/init': {
        status: 409,
        body: { error: 'Este negocio ya tiene un canal WhatsApp activo' },
      },
    });

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());

    expect(
      await screen.findByText('Este negocio ya tiene un canal WhatsApp activo'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Ingresa este código en WhatsApp Business')).not.toBeInTheDocument();
  });

  it('closes the modal once the connection succeeds', async () => {
    stubFetch({
      'POST /api/seller/whatsapp/connect/init': {
        body: {
          phoneNumberId: 'pn-1001',
          code: 'ABC-123',
          expiresAt: '2026-12-31T23:59:59.000Z',
        },
      },
      'POST /api/seller/whatsapp/connect/status': { body: { status: 'connected' } },
    });

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());

    // The modal polls the status endpoint → connected → onSuccess → ChatClient closes it.
    //
    // NOTE: do NOT await the pairing code text ('ABC-123') here. The status
    // endpoint returns 'connected' immediately, so the modal's first poll —
    // which fires synchronously on mount — transitions to the success frame
    // in the same tick, and the pending code frame may never be observable.
    // This was a pre-existing flake (confirmed by repeated pre-fix runs);
    // awaiting the 1s success frame instead is deterministic.
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/seller/whatsapp/connect/status',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ phoneNumberId: 'pn-1001' }),
        }),
      ),
    );

    expect(await screen.findByText('¡WhatsApp Conectado!')).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryByText('¡WhatsApp Conectado!')).not.toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  it('skips the modal and refreshes the channel when init reports an already connected number', async () => {
    stubFetch({
      'POST /api/seller/whatsapp/connect/init': {
        body: {
          phoneNumberId: 'pn-1001',
          status: 'connected',
          displayPhoneNumber: '+51 967 356 665',
          connectedAt: '2026-09-21T12:00:00.000Z',
        },
      },
    });

    // 1) mount-subscription fetch → disconnected, 2) whatsapp-tab load →
    // disconnected (connect button visible), 3) post-init refresh → connected.
    mockFetchWhatsAppConversations
      .mockResolvedValueOnce({
        success: true,
        conversations: [],
        channelConnected: false,
        channelId: null,
      })
      .mockResolvedValueOnce({
        success: true,
        conversations: [],
        channelConnected: false,
        channelId: null,
      })
      .mockResolvedValueOnce({
        success: true,
        conversations: [],
        channelConnected: true,
        channelId: 'ch-1001',
      });

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());

    // Success snackbar instead of the pairing modal.
    expect(await screen.findByText('WhatsApp conectado correctamente')).toBeInTheDocument();
    expect(screen.queryByText('Ingresa este código en WhatsApp Business')).not.toBeInTheDocument();

    // The handler refreshed the WhatsApp channel state: the sidebar no longer
    // offers "Conectar WhatsApp" and shows the connected empty state.
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Conectar WhatsApp' })).not.toBeInTheDocument(),
    );
    expect(screen.getByText('No hay conversaciones')).toBeInTheDocument();
  });

  // ─── Coexistence branch (FB Embedded Signup envs present) ─────────────

  it('opens the coexistence modal instead of init+pair-code when FB envs are set', async () => {
    enableFbEnvs();
    stubFetch({}); // no routes → any init/status fetch would 404

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());

    // The coexistence modal renders its own CTA; the pair-code flow must
    // NOT start (no init call, no pairing code UI).
    expect(await screen.findByRole('button', { name: 'Continuar con Meta' })).toBeInTheDocument();
    expect(screen.queryByText('Ingresa este código en WhatsApp Business')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/seller/whatsapp/connect/init',
      expect.anything(),
    );
  });

  it('posts the FINISH payload to connect/complete and polls status with the businessId', async () => {
    enableFbEnvs();
    stubFetch({
      'POST /api/seller/whatsapp/connect/complete': {
        body: {
          phoneNumberId: 'pn-2002',
          wabaId: 'waba-9',
          status: 'pending',
          connectionStatus: 'pending',
          displayPhoneNumber: null,
        },
      },
      'POST /api/seller/whatsapp/connect/status': {
        body: { status: 'connected', connectionStatus: 'connected' },
      },
    });

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());
    // Modal is mounted and idle before the popup event arrives.
    await screen.findByRole('button', { name: 'Continuar con Meta' });

    await act(async () => {
      dispatchEmbeddedSignup('FINISH', {
        business_id: 'meta-biz-1',
        waba_id: 'waba-9',
        phone_number_id: 'pn-2002',
      });
    });

    // connect/complete carries the session businessId + the popup ids.
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/seller/whatsapp/connect/complete',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            businessId: BUSINESS_ID,
            wabaId: 'waba-9',
            phoneNumberId: 'pn-2002',
          }),
        }),
      ),
    );

    // The status poll is tenant-scoped: it includes the businessId.
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/seller/whatsapp/connect/status',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ businessId: BUSINESS_ID, phoneNumberId: 'pn-2002' }),
        }),
      ),
    );

    // Success frame shows, then ChatClient closes the modal and refreshes.
    expect(await screen.findByText('¡WhatsApp Conectado!')).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryByText('¡WhatsApp Conectado!')).not.toBeInTheDocument(),
      { timeout: 3000 },
    );
    expect(await screen.findByText('WhatsApp conectado correctamente')).toBeInTheDocument();
  });

  it('feeds connectionStatus failed back to the coexistence modal on complete error', async () => {
    enableFbEnvs();
    stubFetch({
      'POST /api/seller/whatsapp/connect/complete': {
        status: 409,
        body: { error: 'Este número de WhatsApp ya está vinculado a otro negocio' },
      },
    });

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());
    await screen.findByRole('button', { name: 'Continuar con Meta' });

    await act(async () => {
      dispatchEmbeddedSignup('FINISH', {
        business_id: 'meta-biz-1',
        waba_id: 'waba-9',
        phone_number_id: 'pn-2002',
      });
    });

    // The modal's error-retry state is driven by connectionStatus='failed'.
    expect(await screen.findByText('No se pudo completar la vinculación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('treats a contradictory connected+failed poll as failed (failed wins)', async () => {
    enableFbEnvs();
    stubFetch({
      'POST /api/seller/whatsapp/connect/complete': {
        body: {
          phoneNumberId: 'pn-2002',
          wabaId: 'waba-9',
          status: 'pending',
          connectionStatus: 'pending',
          displayPhoneNumber: null,
        },
      },
      // Contradictory payload (W1 backend bug fixed in slice 2): status says
      // connected while connectionStatus says failed. This is the client-side
      // last line of defense — a failed channel must NEVER render success.
      'POST /api/seller/whatsapp/connect/status': {
        status: 200,
        body: { status: 'connected', connectionStatus: 'failed', isActive: false },
      },
    });

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());
    await screen.findByRole('button', { name: 'Continuar con Meta' });

    await act(async () => {
      dispatchEmbeddedSignup('FINISH', {
        business_id: 'meta-biz-1',
        waba_id: 'waba-9',
        phone_number_id: 'pn-2002',
      });
    });

    // The contradiction must surface the error-retry frame, NOT success.
    expect(await screen.findByText('No se pudo completar la vinculación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByText('¡WhatsApp Conectado!')).not.toBeInTheDocument();
  });

  it('surfaces the YCloud bind error text in the coexistence modal', async () => {
    enableFbEnvs();
    stubFetch({
      'POST /api/seller/whatsapp/connect/complete': {
        status: 409,
        body: {
          error: 'PAYMENT_METHOD_REQUIRED: Agrega un método de pago para habilitar WhatsApp',
        },
      },
    });

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());
    await screen.findByRole('button', { name: 'Continuar con Meta' });

    await act(async () => {
      dispatchEmbeddedSignup('FINISH', {
        business_id: 'meta-biz-1',
        waba_id: 'waba-9',
        phone_number_id: 'pn-2002',
      });
    });

    // The real YCloud message must be visible in the error frame, not just
    // the generic title — the seller needs to know WHY the bind failed.
    expect(await screen.findByText(/PAYMENT_METHOD_REQUIRED/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('re-launches the popup and re-posts complete when retrying after a bind failure', async () => {
    enableFbEnvs();
    let completeCalls = 0;
    stubFetch({
      'POST /api/seller/whatsapp/connect/complete': () => {
        completeCalls += 1;
        return completeCalls === 1
          ? { status: 409, body: { error: 'WABA_NOT_FOUND: The WABA does not exist' } }
          : {
              status: 200,
              body: {
                phoneNumberId: 'pn-2002',
                wabaId: 'waba-9',
                status: 'pending',
                connectionStatus: 'pending',
                displayPhoneNumber: null,
              },
            };
      },
      'POST /api/seller/whatsapp/connect/status': {
        body: { status: 'connected', connectionStatus: 'connected' },
      },
    });

    // Stub the FB SDK so the popup launch inside the retry click resolves.
    const fbLogin = vi.fn();
    (window as { FB?: { init: unknown; login: unknown } }).FB = { init: vi.fn(), login: fbLogin };

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());
    await screen.findByRole('button', { name: 'Continuar con Meta' });

    await act(async () => {
      dispatchEmbeddedSignup('FINISH', {
        business_id: 'meta-biz-1',
        waba_id: 'waba-9',
        phone_number_id: 'pn-2002',
      });
    });
    await screen.findByText('No se pudo completar la vinculación');

    // Retry must clear the parent-driven 'failed' state (otherwise the modal
    // stays locked in error-retry forever) and re-open the popup.
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(fbLogin).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Conectando con Meta…')).toBeInTheDocument();

    await act(async () => {
      dispatchEmbeddedSignup('FINISH', {
        business_id: 'meta-biz-1',
        waba_id: 'waba-9',
        phone_number_id: 'pn-2002',
      });
    });

    // Second FINISH → complete re-POSTed → pending → poll → connected.
    await waitFor(() => expect(completeCalls).toBe(2));
    expect(await screen.findByText('¡WhatsApp Conectado!')).toBeInTheDocument();
  });

  it('does not mount the coexistence modal when FB envs are absent', async () => {
    stubFetch({
      'POST /api/seller/whatsapp/connect/init': {
        body: {
          phoneNumberId: 'pn-1001',
          code: 'ABC-123',
          expiresAt: '2026-12-31T23:59:59.000Z',
        },
      },
    });

    renderChatClient();
    fireEvent.click(await goToWhatsAppTab());

    // Pair-code fallback keeps working; no coexistence CTA anywhere.
    expect(await screen.findByText('ABC-123')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continuar con Meta' })).not.toBeInTheDocument();
  });
});
