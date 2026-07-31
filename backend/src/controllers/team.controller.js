import * as service from "../services/invitations.service.js";

/**
 * Team Management controller. Admin-gated endpoints (via requireAdmin) plus two
 * PUBLIC endpoints for the invite-accept flow (token-validated in the service).
 */

function handleServiceError(res, err, fallback = "Request failed") {
  const status = err?.statusCode ?? 500;
  if (status >= 500) console.error("[invitations]", err?.message ?? err);
  return res.status(status).json({ error: err?.message ?? fallback });
}

// --- Admin: invitations ---

export async function createInvitation(req, res) {
  try {
    const result = await service.createInvitation({
      email: req.body.email,
      fullName: req.body.fullName,
      displayRole: req.body.role,
      department: req.body.department,
      message: req.body.message,
      invitedBy: req.admin?.id,
      invitedByName: req.admin?.email,
    });
    return res.status(201).json(result);
  } catch (err) {
    return handleServiceError(res, err, "Could not send invitation");
  }
}

export async function listInvitations(_req, res) {
  try {
    const invitations = await service.listInvitations();
    return res.json({ invitations });
  } catch (err) {
    return handleServiceError(res, err, "Could not load invitations");
  }
}

export async function resendInvitation(req, res) {
  try {
    const result = await service.resendInvitation(req.params.id, {
      invitedByName: req.admin?.email,
    });
    return res.json(result);
  } catch (err) {
    return handleServiceError(res, err, "Could not resend invitation");
  }
}

export async function cancelInvitation(req, res) {
  try {
    const invitation = await service.cancelInvitation(req.params.id);
    return res.json({ invitation });
  } catch (err) {
    return handleServiceError(res, err, "Could not cancel invitation");
  }
}

// --- Admin: members ---

export async function listMembers(_req, res) {
  try {
    const members = await service.listMembers();
    return res.json({ members });
  } catch (err) {
    return handleServiceError(res, err, "Could not load members");
  }
}

export async function updateMemberRole(req, res) {
  try {
    const result = await service.updateMemberRole(req.params.id, req.body.appRole);
    return res.json(result);
  } catch (err) {
    return handleServiceError(res, err, "Could not update role");
  }
}

export async function setMemberStatus(req, res) {
  try {
    const result = await service.setMemberStatus(req.params.id, req.body.status);
    return res.json(result);
  } catch (err) {
    return handleServiceError(res, err, "Could not update member status");
  }
}

export async function removeMember(req, res) {
  try {
    const result = await service.removeMember(req.params.id, { actorId: req.admin?.id });
    return res.json(result);
  } catch (err) {
    return handleServiceError(res, err, "Could not remove member");
  }
}

// --- Public: accept flow ---

export async function getInvitation(req, res) {
  try {
    const result = await service.getInvitationForAccept(req.query.token);
    return res.json(result);
  } catch (err) {
    return handleServiceError(res, err, "Could not load invitation");
  }
}

export async function acceptInvitation(req, res) {
  try {
    const result = await service.acceptInvitation({
      token: req.body.token,
      password: req.body.password,
      fullName: req.body.fullName,
    });
    return res.json(result);
  } catch (err) {
    return handleServiceError(res, err, "Could not accept invitation");
  }
}
