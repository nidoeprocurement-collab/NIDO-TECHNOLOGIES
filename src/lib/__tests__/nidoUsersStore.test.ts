import { beforeEach, describe, expect, it } from "vitest";
import {
  SYSTEM_OWNER_ID,
  SYSTEM_OWNER_ROLE,
  addUser,
  deleteUser,
  getUsers,
  saveUsers,
  updateUser,
} from "@/lib/nidoUsersStore";

describe("NIDO users live store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps the System Owner present and unchanged when a saved list omits it", () => {
    const owner = getUsers().find(user => user.id === SYSTEM_OWNER_ID);
    expect(owner?.role).toBe(SYSTEM_OWNER_ROLE);

    saveUsers(getUsers().filter(user => user.id !== SYSTEM_OWNER_ID));

    const restored = getUsers().find(user => user.id === SYSTEM_OWNER_ID);
    expect(restored).toMatchObject({
      id: SYSTEM_OWNER_ID,
      name: "System Owner",
      email: "owner@nidotech.com",
      role: SYSTEM_OWNER_ROLE,
      status: "Active",
    });
  });

  it("blocks edits and deletion of the System Owner account", () => {
    const owner = getUsers().find(user => user.id === SYSTEM_OWNER_ID)!;

    updateUser(owner.id, {
      name: "Changed Owner",
      email: "changed@example.com",
      password: "Changed@123",
      role: "System Admin",
      status: "Inactive",
    });
    deleteUser(owner.id);

    const unchanged = getUsers().find(user => user.id === SYSTEM_OWNER_ID)!;
    expect(unchanged.name).toBe("System Owner");
    expect(unchanged.email).toBe("owner@nidotech.com");
    expect(unchanged.password).toBe("Owner@123");
    expect(unchanged.role).toBe(SYSTEM_OWNER_ROLE);
    expect(unchanged.status).toBe("Active");
  });

  it("shows newly added users through the shared store", () => {
    addUser({
      employeeId: "EMP-099",
      name: "Live User",
      email: "live.user@nidotech.com",
      password: "Live@123",
      phone: "",
      role: "System Admin",
      jobTitle: "Administrator",
      designation: "Administrator",
      department: "IT",
      status: "Active",
      createdAt: "",
      updatedAt: "",
    });

    expect(getUsers().some(user => user.email === "live.user@nidotech.com")).toBe(true);
  });
});