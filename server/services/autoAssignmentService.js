import { pool } from "../db.js";

export const ASSIGNMENT_TIERS = ["Premium", "Medium", "Standard"];

function normalizeTier(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const knownLabels = {
    "premium clients": "Premium",
    "medium clients": "Medium",
    "standard clients": "Standard",
  };
  const match = ASSIGNMENT_TIERS.find((tier) => tier.toLowerCase() === normalized)
    || knownLabels[normalized];
  return match || null;
}

function employeeRosterRows(employees) {
  if (!Array.isArray(employees)) throw new Error("The employee list is required.");
  return employees.map((employee) => {
    const id = String(employee?.id || "").trim();
    const name = String(employee?.name || "").trim();
    if (!id || !name) throw new Error("Every employee needs an ID and name.");
    return {
      id,
      name: name.slice(0, 200),
      role: String(employee.role || "").trim().slice(0, 160),
      department: String(employee.department || "").trim().slice(0, 160),
      active: employee.active === true,
      roleActive: employee.roleActive !== false,
    };
  });
}

async function syncEmployees(client, employees) {
  const roster = employeeRosterRows(employees);
  for (const employee of roster) {
    await client.query(
      `INSERT INTO auto_assignment_employees
         (employee_id,name,role,department,active,role_active,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,now())
       ON CONFLICT (employee_id) DO UPDATE SET
         name=EXCLUDED.name, role=EXCLUDED.role, department=EXCLUDED.department,
         active=EXCLUDED.active, role_active=EXCLUDED.role_active, updated_at=now()`,
      [employee.id, employee.name, employee.role, employee.department, employee.active, employee.roleActive],
    );
  }
  if (roster.length) {
    await client.query(
      `UPDATE auto_assignment_employees
       SET active=false, updated_at=now()
       WHERE employee_id <> ALL($1::text[])`,
      [roster.map((employee) => employee.id)],
    );
  } else {
    await client.query("UPDATE auto_assignment_employees SET active=false, updated_at=now()");
  }
  return roster;
}

async function loadConfig(client = pool) {
  const { rows: settingsRows } = await client.query(
    "SELECT enabled, updated_at, updated_by FROM auto_assignment_settings WHERE id=1",
  );
  const { rows: tierRows } = await client.query(
    `SELECT t.tier, t.enabled, t.next_employee_id, t.fallback_behavior,
            t.fallback_employee_id, t.updated_at, t.updated_by,
            e.employee_id, e.sequence_position, u.name, u.role, u.department,
            u.active, u.role_active
     FROM auto_assignment_tiers t
     LEFT JOIN auto_assignment_tier_employees e ON e.tier=t.tier
     LEFT JOIN auto_assignment_employees u ON u.employee_id=e.employee_id
     ORDER BY CASE t.tier WHEN 'Premium' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
              e.sequence_position`,
  );
  const tiers = ASSIGNMENT_TIERS.map((tier) => {
    const rows = tierRows.filter((row) => row.tier === tier);
    const row = rows[0] || {};
    return {
      tier,
      enabled: Boolean(row.enabled),
      nextEmployeeId: row.next_employee_id || null,
      fallbackBehavior: row.fallback_behavior || "unassigned_notify",
      fallbackEmployeeId: row.fallback_employee_id || null,
      updatedAt: row.updated_at || null,
      employees: rows
        .filter((entry) => entry.employee_id)
        .map((entry) => ({
          id: entry.employee_id,
          name: entry.name || "Unavailable employee",
          role: entry.role || "",
          department: entry.department || "",
          active: Boolean(entry.active && entry.role_active),
          sequence: Number(entry.sequence_position),
        })),
    };
  });
  return {
    enabled: Boolean(settingsRows[0]?.enabled),
    updatedAt: settingsRows[0]?.updated_at || null,
    updatedBy: settingsRows[0]?.updated_by || "system",
    tiers,
  };
}

export async function getAutoAssignmentConfig() {
  return loadConfig();
}

export async function saveAutoAssignmentConfig(input, actor) {
  if (!input || !Array.isArray(input.tiers)) throw new Error("Assignment tiers are required.");
  const tiersByName = new Map(input.tiers.map((tier) => [normalizeTier(tier.tier), tier]));
  if (ASSIGNMENT_TIERS.some((tier) => !tiersByName.has(tier))) {
    throw new Error("Premium, Medium, and Standard settings are all required.");
  }
  const roster = employeeRosterRows(input.employees);
  const rosterById = new Map(roster.map((employee) => [employee.id, employee]));
  if (roster.length !== input.employees.length) throw new Error("Employee IDs must be unique.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await syncEmployees(client, roster);
    await client.query(
      `UPDATE auto_assignment_settings
       SET enabled=$1, updated_at=now(), updated_by=$2 WHERE id=1`,
      [input.enabled !== false, actor.id],
    );

    for (const tierName of ASSIGNMENT_TIERS) {
      const setting = tiersByName.get(tierName);
      if (!Array.isArray(setting.employees)) throw new Error(`${tierName} employee sequence is required.`);
      const seen = new Set();
      const orderedEmployees = [...setting.employees].sort(
        (left, right) => Number(left.sequence) - Number(right.sequence),
      );
      for (let index = 0; index < orderedEmployees.length; index += 1) {
        const employeeId = String(orderedEmployees[index].id || "");
        const employee = rosterById.get(employeeId);
        if (!employee || !employee.active || !employee.roleActive) {
          throw new Error(`${tierName} contains an inactive or unavailable employee.`);
        }
        if (seen.has(employeeId)) throw new Error(`${tierName} contains a duplicate employee.`);
        seen.add(employeeId);
        if (Number(orderedEmployees[index].sequence) !== index + 1) {
          throw new Error(`${tierName} sequence numbers must be consecutive, starting at 1.`);
        }
      }
      if (setting.enabled && orderedEmployees.length === 0) {
        throw new Error(`${tierName} must have at least one active employee before it can be enabled.`);
      }

      const fallbackBehavior = setting.fallbackBehavior === "fallback_employee"
        ? "fallback_employee"
        : "unassigned_notify";
      const fallbackEmployeeId = setting.fallbackEmployeeId
        ? String(setting.fallbackEmployeeId)
        : null;
      if (
        fallbackBehavior === "fallback_employee"
        && (!rosterById.get(fallbackEmployeeId)?.active || !rosterById.get(fallbackEmployeeId)?.roleActive)
      ) {
        throw new Error(`${tierName} fallback must be an active employee.`);
      }

      await client.query(
        `UPDATE auto_assignment_tiers
         SET enabled=$2, fallback_behavior=$3, fallback_employee_id=$4,
             updated_at=now(), updated_by=$5
         WHERE tier=$1`,
        [tierName, setting.enabled === true, fallbackBehavior, fallbackEmployeeId, actor.id],
      );
      await client.query("DELETE FROM auto_assignment_tier_employees WHERE tier=$1", [tierName]);
      for (let index = 0; index < orderedEmployees.length; index += 1) {
        await client.query(
          `INSERT INTO auto_assignment_tier_employees (tier,employee_id,sequence_position)
           VALUES ($1,$2,$3)`,
          [tierName, String(orderedEmployees[index].id), index + 1],
        );
      }
      const currentPointer = await client.query(
        "SELECT next_employee_id FROM auto_assignment_tiers WHERE tier=$1",
        [tierName],
      );
      if (
        currentPointer.rows[0]?.next_employee_id
        && !seen.has(currentPointer.rows[0].next_employee_id)
      ) {
        await client.query(
          "UPDATE auto_assignment_tiers SET next_employee_id=$2 WHERE tier=$1",
          [tierName, orderedEmployees[0]?.id || null],
        );
      }
    }
    await client.query("COMMIT");
    return await loadConfig();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function syncAutoAssignmentEmployees(employees) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await syncEmployees(client, employees);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function previewAutoAssignments() {
  const config = await loadConfig();
  const result = [];
  for (const tier of config.tiers) {
    const activeEmployees = tier.employees.filter((employee) => employee.active);
    let position = activeEmployees.findIndex((employee) => employee.id === tier.nextEmployeeId);
    if (position < 0) position = 0;
    let fallback = null;
    if (tier.fallbackBehavior === "fallback_employee" && tier.fallbackEmployeeId) {
      const { rows } = await pool.query(
        `SELECT employee_id AS id, name, role, department
         FROM auto_assignment_employees
         WHERE employee_id=$1 AND active=true AND role_active=true`,
        [tier.fallbackEmployeeId],
      );
      fallback = rows[0] || null;
    }
    result.push({
      tier: tier.tier,
      enabled: config.enabled && tier.enabled,
      nextEmployeeId: tier.nextEmployeeId,
      assignments: Array.from({ length: 5 }, (_, index) => {
        if (!config.enabled || !tier.enabled) {
          return { order: index + 1, employeeId: null, employeeName: "Auto assignment disabled" };
        }
        if (activeEmployees.length) {
          const employee = activeEmployees[(position + index) % activeEmployees.length];
          return { order: index + 1, employeeId: employee.id, employeeName: employee.name };
        }
        if (fallback) {
          return { order: index + 1, employeeId: fallback.id, employeeName: fallback.name, fallback: true };
        }
        return { order: index + 1, employeeId: null, employeeName: "Unassigned — no eligible employee" };
      }),
    });
  }
  return result;
}

async function insertHistory(client, order, event, actor) {
  await client.query(
    `INSERT INTO auto_assignment_history
       (order_id,client_id,client_name,client_tier,previous_employee_id,previous_employee_name,
        new_employee_id,new_employee_name,assignment_method,sequence_position,status,reason,
        actor_id,actor_name,actor_role)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      order.order_id, order.client_id, order.client_name, order.client_tier,
      event.previousEmployeeId || null, event.previousEmployeeName || null,
      event.newEmployeeId || null, event.newEmployeeName || null,
      event.method, event.sequencePosition ?? null, event.status, event.reason || "",
      actor.id, actor.name, actor.role,
    ],
  );
}

export async function assignOrderAutomatically(input, actor) {
  const orderId = String(input?.assignmentId || "").trim();
  const displayOrderId = String(input?.orderId || "").trim();
  const clientId = String(input?.clientId || "").trim();
  if (!orderId || orderId.length > 160) throw new Error("A stable assignment ID is required.");
  if (!displayOrderId || displayOrderId.length > 160) throw new Error("A valid order number is required.");
  if (!clientId || clientId.length > 160) throw new Error("A valid client ID is required.");
  const clientName = String(input.clientName || "").trim().slice(0, 240);
  const rawTier = String(input.clientTier || "").trim().slice(0, 80);
  const tier = normalizeTier(rawTier);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT * FROM auto_assignment_orders WHERE order_id=$1 FOR UPDATE",
      [orderId],
    );
    if (existing.rows[0]) {
      await client.query("COMMIT");
      return existing.rows[0];
    }
    if (Array.isArray(input.employees)) {
      await syncEmployees(client, input.employees);
    }

    const globalSettings = await client.query(
      "SELECT enabled FROM auto_assignment_settings WHERE id=1 FOR UPDATE",
    );
    const tierResult = tier
      ? await client.query("SELECT * FROM auto_assignment_tiers WHERE tier=$1 FOR UPDATE", [tier])
      : { rows: [] };
    const tierConfig = tierResult.rows[0] || null;
    const sequenceResult = tierConfig
      ? await client.query(
          `SELECT e.employee_id AS id, e.name, e.role, e.department, t.sequence_position
           FROM auto_assignment_tier_employees t
           JOIN auto_assignment_employees e ON e.employee_id=t.employee_id
           WHERE t.tier=$1 AND e.active=true AND e.role_active=true
           ORDER BY t.sequence_position`,
          [tier],
        )
      : { rows: [] };
    const sequence = sequenceResult.rows;
    const cursor = sequence.findIndex((employee) => employee.id === tierConfig?.next_employee_id);
    const selected = sequence.length ? sequence[cursor >= 0 ? cursor : 0] : null;
    let assignedEmployee = selected || null;
    let sequencePosition = selected ? Number(selected.sequence_position) : null;
    if (!assignedEmployee && tierConfig?.fallback_behavior === "fallback_employee") {
      const fallback = await client.query(
        `SELECT employee_id AS id, name, role, department
         FROM auto_assignment_employees
         WHERE employee_id=$1 AND active=true AND role_active=true`,
        [tierConfig.fallback_employee_id],
      );
      assignedEmployee = fallback.rows[0] || null;
      sequencePosition = assignedEmployee ? 0 : null;
    }

    const globalEnabled = globalSettings.rows[0]?.enabled === true;
    const tierEnabled = Boolean(tierConfig?.enabled);
    if (!globalEnabled || !tierEnabled) {
      assignedEmployee = null;
      sequencePosition = null;
    }
    const status = !globalEnabled
      ? "disabled"
      : !tier
        ? "unassigned"
        : !tierEnabled
          ? "disabled"
          : assignedEmployee
            ? "assigned"
            : "unassigned";
    let reason = "";
    if (!globalEnabled) reason = "Automatic order assignment is disabled.";
    else if (!tier) reason = `Client tier "${rawTier || "not set"}" is not configured for automatic assignment.`;
    else if (!tierEnabled) reason = `${tier} automatic assignment is disabled.`;
    else if (assignedEmployee && !selected) reason = `Fallback employee ${assignedEmployee.name} was used because no sequence employee is available.`;
    else if (!assignedEmployee) reason = `No active eligible employee is available for ${tier}.`;

    const orderResult = await client.query(
      `INSERT INTO auto_assignment_orders
         (order_id,display_order_id,client_id,client_name,client_tier,assigned_employee_id,assigned_employee_name,
          assignment_method,configuration_snapshot,sequence_position,status,assigned_at,
          created_by,created_by_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Automatic',$8,$9,$10,
               CASE WHEN $10='assigned' THEN now() ELSE NULL END,$11,$12)
       RETURNING *`,
      [
        orderId, displayOrderId, clientId, clientName, tier || rawTier,
        assignedEmployee?.id || null, assignedEmployee?.name || null,
        JSON.stringify({
          tier: tier || rawTier || null,
          clientTierSource: rawTier || null,
          enabled: globalEnabled && tierEnabled,
          sequence: sequence.map((employee) => ({ id: employee.id, name: employee.name })),
          fallbackBehavior: tierConfig?.fallback_behavior || "unassigned_notify",
          fallbackEmployeeId: tierConfig?.fallback_employee_id || null,
        }),
        sequencePosition, status, actor.id, actor.name,
      ],
    );
    const savedOrder = orderResult.rows[0];
    await insertHistory(client, savedOrder, {
      method: "Automatic",
      status,
      sequencePosition,
      newEmployeeId: assignedEmployee?.id,
      newEmployeeName: assignedEmployee?.name,
      reason,
    }, actor);

    if (status === "unassigned") {
      await client.query(
        `INSERT INTO auto_assignment_notifications (order_id,message)
         VALUES ($1,$2) ON CONFLICT (order_id) DO NOTHING`,
        [orderId, `${displayOrderId} needs an assignee: ${reason}`],
      );
    } else if (status === "assigned" && selected && sequence.length) {
      const nextEmployee = sequence[(sequence.indexOf(selected) + 1) % sequence.length];
      await client.query(
        "UPDATE auto_assignment_tiers SET next_employee_id=$2, updated_at=now() WHERE tier=$1",
        [tier, nextEmployee?.id || null],
      );
    }
    await client.query("COMMIT");
    return savedOrder;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      const { rows } = await pool.query(
        "SELECT * FROM auto_assignment_orders WHERE order_id=$1",
        [orderId],
      );
      if (rows[0]) return rows[0];
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function manuallyAssignOrder(orderId, employeeId, reason, actor) {
  const cleanOrderId = String(orderId || "").trim();
  const cleanEmployeeId = String(employeeId || "").trim();
  const cleanReason = String(reason || "").trim().slice(0, 1000);
  if (!cleanOrderId || !cleanEmployeeId) throw new Error("Order and employee are required.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM auto_assignment_orders WHERE order_id=$1 FOR UPDATE",
      [cleanOrderId],
    );
    const current = rows[0];
    if (!current) throw new Error("Order assignment was not found.");
    if (current.assigned_employee_id === cleanEmployeeId) {
      throw new Error("This employee is already assigned to the order.");
    }
    if (current.assigned_employee_id && !cleanReason) {
      throw new Error("A reason is required when reassigning an order.");
    }
    const tier = normalizeTier(current.client_tier);
    if (!tier) throw new Error("The order's client tier must be corrected before manual assignment.");
    const { rows: employees } = await client.query(
      `SELECT e.employee_id AS id, e.name
       FROM auto_assignment_employees e
       JOIN auto_assignment_tier_employees t ON t.employee_id=e.employee_id
       WHERE e.employee_id=$1 AND t.tier=$2 AND e.active=true AND e.role_active=true`,
      [cleanEmployeeId, tier],
    );
    const employee = employees[0];
    if (!employee) throw new Error("Select an active employee configured for this client tier.");

    const wasReassignment = Boolean(current.assigned_employee_id);
    const { rows: updatedRows } = await client.query(
      `UPDATE auto_assignment_orders
       SET previous_employee_id=assigned_employee_id,
           previous_employee_name=assigned_employee_name,
           assigned_employee_id=$2, assigned_employee_name=$3,
           assignment_method='Manual', status='assigned', sequence_position=NULL,
           reassignment_reason=$4, assigned_at=now(), updated_at=now()
       WHERE order_id=$1 RETURNING *`,
      [cleanOrderId, employee.id, employee.name, cleanReason],
    );
    const updated = updatedRows[0];
    await insertHistory(client, updated, {
      method: "Manual",
      status: wasReassignment ? "reassigned" : "assigned",
      previousEmployeeId: current.assigned_employee_id,
      previousEmployeeName: current.assigned_employee_name,
      newEmployeeId: employee.id,
      newEmployeeName: employee.name,
      reason: cleanReason,
    }, actor);
    await client.query(
      `UPDATE auto_assignment_notifications
       SET status='resolved', resolved_at=now(), resolved_by=$2
       WHERE order_id=$1 AND status='pending'`,
      [cleanOrderId, actor.id],
    );
    await client.query("COMMIT");
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listAssignmentHistory(filters = {}) {
  const clauses = [];
  const params = [];
  const add = (clause, value) => {
    params.push(value);
    clauses.push(clause.replace("?", `$${params.length}`));
  };
  if (filters.tier && ASSIGNMENT_TIERS.includes(filters.tier)) add("h.client_tier=?", filters.tier);
  if (filters.employeeId) {
    params.push(String(filters.employeeId));
    clauses.push(`(h.new_employee_id=$${params.length} OR h.previous_employee_id=$${params.length})`);
  }
  if (filters.method && ["Automatic", "Manual"].includes(filters.method)) add("h.assignment_method=?", filters.method);
  if (filters.status && ["assigned", "unassigned", "disabled", "reassigned"].includes(filters.status)) add("h.status=?", filters.status);
  if (filters.startDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.startDate)) add("h.created_at >= ?::date", filters.startDate);
  if (filters.endDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) add("h.created_at < (?::date + interval '1 day')", filters.endDate);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT h.id, h.order_id AS assignment_id, o.display_order_id AS order_id,
            h.client_id, h.client_name, h.client_tier,
            h.previous_employee_id, h.previous_employee_name, h.new_employee_id,
            h.new_employee_name, h.assignment_method, h.sequence_position, h.status,
            h.reason, h.actor_name, h.actor_role, h.created_at,
            o.assigned_employee_id AS current_employee_id,
            o.assigned_employee_name AS current_employee_name
     FROM auto_assignment_history h
     JOIN auto_assignment_orders o ON o.order_id=h.order_id
     ${where}
     ORDER BY h.created_at DESC, h.id DESC
     LIMIT 500`,
    params,
  );
  return rows;
}

export async function listUnassignedQueue() {
  const { rows } = await pool.query(
    `SELECT n.order_id AS assignment_id, o.display_order_id AS order_id, n.message, n.created_at, o.client_id, o.client_name,
            o.client_tier, o.status, o.assigned_employee_id, o.assigned_employee_name
     FROM auto_assignment_notifications n
     JOIN auto_assignment_orders o ON o.order_id=n.order_id
     WHERE n.status='pending'
     ORDER BY n.created_at DESC
     LIMIT 200`,
  );
  return rows;
}
