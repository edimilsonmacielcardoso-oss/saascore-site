import type { APIRoute } from 'astro';
import { getLeads, createLead, updateLeadStatus, deleteLead, clearAllLeads, resetToDemoLeads } from '../../lib/db';

export const prerender = false;

// GET /api/leads - Retorna todos os leads cadastrados
export const GET: APIRoute = async () => {
  try {
    const leads = await getLeads();
    return new Response(JSON.stringify({ success: true, leads }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Falha ao recuperar leads' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/leads - Salva um novo lead vindo do formulário
export const POST: APIRoute = async ({ request }) => {
  try {
    let body: any = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        name: formData.get('name')?.toString() || '',
        email: formData.get('email')?.toString() || '',
        phone: formData.get('phone')?.toString() || '',
        institution: formData.get('institution')?.toString() || '',
        park_size: formData.get('park_size')?.toString() || '',
        message: formData.get('message')?.toString() || '',
      };
    } else {
      body = await request.json().catch(() => ({}));
    }

    // Validação básica dos campos obrigatórios
    if (!body.name || !body.email || !body.institution || !body.park_size) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos obrigatórios ausentes: Nome, E-mail, Instituição e Porte são necessários.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const newLead = await createLead({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || '',
      institution: body.institution.trim(),
      park_size: body.park_size.trim(),
      message: body.message?.trim() || '',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead registrado com sucesso na base SaaSCore Sistemas!',
        lead: newLead,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro no endpoint POST /api/leads:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno ao processar cadastro de lead.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// PATCH /api/leads - Atualiza status do lead
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return new Response(JSON.stringify({ success: false, error: 'ID e status são obrigatórios.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updated = await updateLeadStatus(id, status);

    if (!updated) {
      return new Response(JSON.stringify({ success: false, error: 'Lead não encontrado.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, lead: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Erro ao atualizar status.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/leads - Remove um lead ou limpa a base
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id, clearAll } = await request.json().catch(() => ({}));

    if (clearAll) {
      await clearAllLeads();
      return new Response(JSON.stringify({ success: true, message: 'Todos os leads foram removidos com sucesso.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'ID é obrigatório.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deleted = await deleteLead(id);

    return new Response(JSON.stringify({ success: deleted }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Erro ao excluir lead.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT /api/leads - Restaura dados de demonstração
export const PUT: APIRoute = async () => {
  try {
    const leads = await resetToDemoLeads();
    return new Response(JSON.stringify({ success: true, leads }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Erro ao restaurar dados de demonstração.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
